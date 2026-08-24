import {
  ISellerIntakePayload,
  ISellerOfferResult,
  IOfferConfidenceGate,
  IComparableSale,
  DataCertaintyLevel,
} from "../../shared/contracts";
import { WichitaPropertyService, WichitaPublicPropertyRecord } from "./wichitaPropertyService.js";
import { PiperOutboxService } from "./piperAdapter.js";
import { OcgObservability } from "./observability.js";

function getDataMode(): "production" | "development" | "demo" {
  const configured = (process.env.OCGICT_DATA_MODE || "").toLowerCase();
  if (configured === "demo") return "demo";
  if (configured === "development") return "development";
  return "production";
}

export class SellerUnderwritingService {
  public static async processSellerIntake(payload: ISellerIntakePayload & any): Promise<ISellerOfferResult> {
    const startTime = Date.now();
    const dataMode = getDataMode();
    const cleanAddress = (payload.address || "").trim();
    const sellerSituation = payload.sellerSituation || payload.situation || "Exploring Options";
    const propertyCondition = payload.propertyCondition || payload.conditionLevel || "Dated / Needs Updates";
    const desiredTimeline = payload.desiredTimeline || payload.timeline || "Flexible";
    const primaryPriority = payload.primaryPriority || payload.priority || "No Repairs / As-Is";
    const fullName = payload.fullName || payload.sellerName || "Direct Property Owner";
    const email = payload.email || payload.sellerEmail || "";
    const phone = payload.phone || payload.sellerPhone || "";

    OcgObservability.log("SELLER_INTAKE_PROCESSING_STARTED", {
      address: cleanAddress,
      condition: propertyCondition,
      situation: sellerSituation,
      dataMode,
    });

    const [publicRecord, comps] = await Promise.all([
      WichitaPropertyService.lookupPublicRecord({ address: cleanAddress }),
      this.fetchComparableSales(cleanAddress, dataMode),
    ]);

    // Never invent missing property facts in production. Zero values are used only
    // as neutral placeholders in the response contract when the record is unavailable.
    const livingAreaSqft = publicRecord?.livingAreaSqft ?? 0;
    const yearBuilt = publicRecord?.yearBuilt ?? 0;
    const propertyType = publicRecord?.zoningDescription || "Property details pending verification";
    const totalAppraised = publicRecord?.totalAppraisedValue ?? 0;
    const parcelId = publicRecord?.parcelId;

    const { estimatedArv, arvConfidence } = this.calculateEstimatedArv(comps, livingAreaSqft);

    const rehab = livingAreaSqft > 0
      ? this.calculateRehabScope({ ...payload, propertyCondition, sellerSituation, desiredTimeline, primaryPriority }, livingAreaSqft, yearBuilt)
      : this.emptyRehabResult();

    const acquisitionMultiplier = 0.70;
    const grossArvCap = estimatedArv > 0 ? Math.round(estimatedArv * acquisitionMultiplier) : 0;
    const internalMaoCeiling = estimatedArv > 0
      ? Math.max(0, grossArvCap - rehab.estimatedRehabBudget)
      : 0;

    const probateOrLegalFlag = ["probate", "inherited", "estate"].some((term) => sellerSituation.toLowerCase().includes(term));
    const propertyMatchConfidence = publicRecord ? (dataMode === "production" ? 0.95 : 0.65) : 0;
    const compQualityScore = comps.length >= 3 ? (dataMode === "production" ? 0.88 : 0.60) : comps.length > 0 ? 0.45 : 0;

    const confidenceGate = this.evaluateConfidenceGate({
      propertyMatchConfidence,
      compQualityScore,
      arvConfidence,
      repairEstimateConfidence: rehab.repairConfidence,
      dataFreshnessDays: dataMode === "production" && comps.length > 0 ? 45 : 9999,
      ownershipConsistency: !probateOrLegalFlag,
      structuralRiskDetected: rehab.structuralRiskDetected,
      probateOrLegalFlag,
      hasPublicRecord: !!publicRecord,
      liveCompsAvailable: dataMode === "production" && comps.length >= 3,
      productionMode: dataMode === "production",
    });

    const sellerOfferPresentation = this.buildOfferPresentation({
      confidenceGate,
      internalMaoCeiling,
      estimatedArv,
      estimatedRehabBudget: rehab.estimatedRehabBudget,
    });

    const certaintyLevel: DataCertaintyLevel =
      confidenceGate.tier === "HIGH_CONFIDENCE"
        ? "ESTIMATED"
        : confidenceGate.tier === "MEDIUM_CONFIDENCE"
          ? "PROVISIONAL"
          : "PROFESSIONAL_VERIFICATION_REQ";

    const trackingId = `SELLER_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await PiperOutboxService.enqueueLead({
      briefId: trackingId,
      fullName,
      email,
      phone,
      address: cleanAddress,
      targetStrategy: "Direct Sale / Liquidation",
      liquidityTier: "Equity / Real Estate Only",
      timeline: desiredTimeline,
      summary: `Seller property intake for ${cleanAddress}. Status: ${sellerOfferPresentation.status}. Condition: ${propertyCondition}. Priority: ${primaryPriority}. Notes: ${payload.sellerNotes || "None"}.`,
    });

    const result: ISellerOfferResult = {
      id: trackingId,
      createdAt: new Date().toISOString(),
      property: {
        address: cleanAddress,
        city: payload.city || "Wichita",
        state: payload.state || "KS",
        zip: payload.zip || "",
        parcelId,
        livingAreaSqft,
        yearBuilt,
        propertyType,
        taxDistrict: publicRecord?.taxDistrict || "Pending verification",
        totalAppraisedValue: totalAppraised,
      },
      provenance: {
        recordsSource: publicRecord?.provenance.source || "Live property provider unavailable — manual review required",
        retrievalTimestamp: new Date().toISOString(),
        certaintyLevel,
      },
      internalUnderwriting: {
        estimatedArv,
        acquisitionMultiplier,
        grossArvCap,
        estimatedRehabBudget: rehab.estimatedRehabBudget,
        rehabBreakdown: rehab.rehabBreakdown,
        internalMaoCeiling,
      },
      sellerOfferPresentation,
      confidenceGate,
      comparableSales: comps,
      piperHandoff: {
        outboxTrackingId: trackingId,
        status: "READY_FOR_PIPER",
        assignedStage: "1. Intake & Preliminary Triage",
        leadCategory: "SELLER_ACQUISITION_DIRECT",
      },
    };

    OcgObservability.log("SELLER_INTAKE_PROCESSED_SUCCESSFULLY", {
      trackingId,
      status: sellerOfferPresentation.status,
      confidenceScore: confidenceGate.overallConfidenceScore,
      dataMode,
      durationMs: Date.now() - startTime,
    });

    return result;
  }

  /**
   * LIVE COMPARABLE PROVIDER PLACEHOLDER.
   * Production returns no comps until the approved Wichita/Sedgwick provider is connected.
   * Demo examples are allowed only outside production and are explicitly labeled DEMO.
   */
  private static async fetchComparableSales(address: string, dataMode: "production" | "development" | "demo"): Promise<IComparableSale[]> {
    if (dataMode === "production") {
      OcgObservability.log("COMPARABLE_PROVIDER_NOT_CONNECTED", {
        address,
        behavior: "MANUAL_REVIEW_REQUIRED",
      });
      return [];
    }

    const upper = address.toUpperCase();
    const demo = (id: string, compAddress: string, distanceMiles: number, salePrice: number, saleDate: string, sqft: number, yearBuilt: number, similarityScore: number): IComparableSale => ({
      id: `DEMO-${id}`,
      address: compAddress,
      distanceMiles,
      salePrice,
      saleDate,
      sqft,
      pricePerSqft: Number((salePrice / sqft).toFixed(2)),
      yearBuilt,
      similarityScore,
      source: "OCGICT DEMO COMPARABLE — NOT LIVE MLS/DEED DATA",
    });

    if (upper.includes("RUTAN") || upper.includes("COLLEGE HILL")) {
      return [
        demo("1", "Demo College Hill Comp A", 0.1, 242000, "2026-06-14", 1680, 1934, 0.94),
        demo("2", "Demo College Hill Comp B", 0.25, 238500, "2026-05-22", 1590, 1930, 0.91),
        demo("3", "Demo College Hill Comp C", 0.35, 249000, "2026-07-02", 1720, 1938, 0.88),
      ];
    }

    return [];
  }

  private static calculateEstimatedArv(comps: IComparableSale[], livingAreaSqft: number): { estimatedArv: number; arvConfidence: number } {
    if (comps.length === 0 || livingAreaSqft <= 0) {
      return { estimatedArv: 0, arvConfidence: 0 };
    }

    const denominator = comps.reduce((acc, c) => acc + c.similarityScore, 0);
    if (denominator <= 0) return { estimatedArv: 0, arvConfidence: 0 };

    const weightedPpsqft = comps.reduce((acc, c) => acc + c.pricePerSqft * c.similarityScore, 0) / denominator;
    const arv = Math.round((weightedPpsqft * livingAreaSqft) / 1000) * 1000;
    const arvConfidence = comps.length >= 3 ? 0.90 : comps.length === 2 ? 0.75 : 0.55;
    return { estimatedArv: arv, arvConfidence };
  }

  private static emptyRehabResult() {
    return {
      estimatedRehabBudget: 0,
      rehabBreakdown: {
        exteriorRoof: 0,
        interiorCosmetic: 0,
        mechanicalsHvac: 0,
        contingencyReserves: 0,
      },
      repairConfidence: 0,
      structuralRiskDetected: false,
    };
  }

  private static calculateRehabScope(payload: ISellerIntakePayload, sqft: number, yearBuilt: number) {
    let baseRatePerSqft = 22;
    let structuralRiskDetected = false;
    let repairConfidence = 0.65; // seller-reported condition only; vision/walkthrough still required

    switch (payload.propertyCondition) {
      case "Move-In Ready": baseRatePerSqft = 10; break;
      case "Dated / Needs Updates": baseRatePerSqft = 25; break;
      case "Needs Major Cosmetic & Mechanical Rehab": baseRatePerSqft = 38; break;
      case "Full Gut / Major Deferred Maintenance": baseRatePerSqft = 55; repairConfidence = 0.55; break;
      case "Severe Structural / Fire Damage": baseRatePerSqft = 80; structuralRiskDetected = true; repairConfidence = 0.30; break;
    }

    if (yearBuilt > 0 && yearBuilt < 1960) baseRatePerSqft += 4;

    let knownRepairsAddon = 0;
    for (const rep of payload.knownRepairs || []) {
      if (rep.includes("Roof")) knownRepairsAddon += 8500;
      if (rep.includes("HVAC")) knownRepairsAddon += 6800;
      if (rep.includes("Foundation")) { knownRepairsAddon += 12000; structuralRiskDetected = true; }
      if (rep.includes("Plumbing")) knownRepairsAddon += 5500;
    }

    const baseRehab = sqft * baseRatePerSqft + knownRepairsAddon;
    const contingencyReserves = Math.round(baseRehab * 0.15);
    const totalRehab = Math.round((baseRehab + contingencyReserves) / 500) * 500;

    return {
      estimatedRehabBudget: totalRehab,
      rehabBreakdown: {
        exteriorRoof: Math.round(totalRehab * 0.30),
        interiorCosmetic: Math.round(totalRehab * 0.35),
        mechanicalsHvac: Math.round(totalRehab * 0.20),
        contingencyReserves,
      },
      repairConfidence,
      structuralRiskDetected,
    };
  }

  private static evaluateConfidenceGate(params: {
    propertyMatchConfidence: number;
    compQualityScore: number;
    arvConfidence: number;
    repairEstimateConfidence: number;
    dataFreshnessDays: number;
    ownershipConsistency: boolean;
    structuralRiskDetected: boolean;
    probateOrLegalFlag: boolean;
    hasPublicRecord: boolean;
    liveCompsAvailable: boolean;
    productionMode: boolean;
  }): IOfferConfidenceGate {
    const reasons: string[] = [];
    const requiredHumanVerifications: string[] = [];

    const compositeScore = Number((
      params.propertyMatchConfidence * 0.25 +
      params.compQualityScore * 0.30 +
      params.arvConfidence * 0.25 +
      params.repairEstimateConfidence * 0.20
    ).toFixed(2));

    if (!params.hasPublicRecord) {
      reasons.push("Live parcel/property records are not yet verified for this submission.");
      requiredHumanVerifications.push("Verify property record and parcel identity");
    }
    if (!params.liveCompsAvailable) {
      reasons.push("Live renovated comparable-sale evidence is not currently available to the automated offer engine.");
      requiredHumanVerifications.push("Run live comparable-sale review");
    }
    if (params.structuralRiskDetected) {
      reasons.push("Potential structural risk requires an on-site review.");
      requiredHumanVerifications.push("Property walkthrough / structural review");
    }
    if (params.probateOrLegalFlag) {
      reasons.push("Estate/probate context requires title and authority verification.");
      requiredHumanVerifications.push("Title / estate authority verification");
    }

    let tier: IOfferConfidenceGate["tier"] = "HUMAN_REVIEW_REQUIRED";

    if (
      params.productionMode &&
      params.hasPublicRecord &&
      params.liveCompsAvailable &&
      !params.structuralRiskDetected &&
      compositeScore >= 0.82 &&
      params.compQualityScore >= 0.80 &&
      params.arvConfidence >= 0.80 &&
      params.repairEstimateConfidence >= 0.75
    ) {
      tier = "HIGH_CONFIDENCE";
      requiredHumanVerifications.push("Standard walkthrough and title review");
    } else if (!params.productionMode && compositeScore >= 0.65 && params.hasPublicRecord) {
      // Development/demo can exercise result screens, but this is never a production-live offer.
      tier = "MEDIUM_CONFIDENCE";
      reasons.push("Development/demo intelligence only; not eligible for a production automated offer.");
    }

    return {
      overallConfidenceScore: compositeScore,
      tier,
      thresholdsMet: {
        propertyMatchConfidence: params.propertyMatchConfidence,
        compQualityScore: params.compQualityScore,
        arvConfidence: params.arvConfidence,
        repairEstimateConfidence: params.repairEstimateConfidence,
        dataFreshnessDays: params.dataFreshnessDays,
        ownershipConsistency: params.ownershipConsistency,
        structuralRiskDetected: params.structuralRiskDetected,
        probateOrLegalFlag: params.probateOrLegalFlag,
      },
      reasonsForTier: reasons,
      requiredHumanVerifications,
    };
  }

  private static buildOfferPresentation(params: {
    confidenceGate: IOfferConfidenceGate;
    internalMaoCeiling: number;
    estimatedArv: number;
    estimatedRehabBudget: number;
  }): ISellerOfferResult["sellerOfferPresentation"] {
    const disclaimer = "This is a non-binding preliminary property review. Any preliminary offer is subject to property walkthrough, verification of condition and property data, title review, and mutual execution of a separate written purchase agreement.";

    if (params.confidenceGate.tier === "HIGH_CONFIDENCE" && params.internalMaoCeiling > 0) {
      const minOffer = Math.round((params.internalMaoCeiling * 0.96) / 1000) * 1000;
      const maxOffer = Math.round((params.internalMaoCeiling * 1.03) / 1000) * 1000;
      return {
        status: "PRELIMINARY_OFFER_AVAILABLE",
        headline: "Your Preliminary OCG Offer Range",
        offerRangeMin: minOffer,
        offerRangeMax: maxOffer,
        singlePointEstimate: params.internalMaoCeiling,
        displayTerms: { isBinding: false, asIsCondition: true, commissionFree: true, subjectToWalkthrough: true, subjectToTitleReview: true },
        explanation: {
          whatOcgReviewed: ["Verified property record", "Live comparable-sale evidence", "Reported/verified condition inputs", "OCG acquisition formula"],
          whatRemainsToBeVerified: ["Physical walkthrough", "Final condition verification", "Title review"],
          nextSteps: ["Accept the preliminary offer or submit a counter", "Select a walkthrough window", "OCG verifies property condition before final written terms"],
        },
        legalDisclaimer: disclaimer,
      };
    }

    return {
      status: "ADDITIONAL_REVIEW_REQUIRED",
      headline: "We Have Your Property — OCG Review Is Underway",
      displayTerms: { isBinding: false, asIsCondition: true, commissionFree: true, subjectToWalkthrough: true, subjectToTitleReview: true },
      explanation: {
        whatOcgReviewed: ["Seller submission", "Available property/provider signals", "Initial acquisition-risk screen"],
        whatRemainsToBeVerified: params.confidenceGate.reasonsForTier.length > 0 ? params.confidenceGate.reasonsForTier : ["Live property and comparable-sale evidence"],
        nextSteps: ["OCG completes the missing property intelligence", "You receive a preliminary offer when the evidence supports one", "A walkthrough verifies condition before final terms"],
      },
      legalDisclaimer: disclaimer,
    };
  }
}
