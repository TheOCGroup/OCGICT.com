import {
  ISellerIntakePayload,
  ISellerOfferResult,
  IOfferConfidenceGate,
  IComparableSale,
  DataCertaintyLevel,
} from "../../shared/contracts";
import { WichitaPropertyService, WichitaPublicPropertyRecord } from "./wichitaPropertyService";
import { PiperOutboxService } from "./piperAdapter";
import { OcgObservability } from "./observability";

/**
 * Guarded seller underwriting pipeline.
 *
 * Current repository state deliberately uses representative Wichita staging fixtures.
 * Those fixtures are useful for deterministic workflow QA, but they are not live county
 * records or verified closed-sale comps. Therefore staging data MUST NOT clear the
 * seller-facing preliminary-offer gate.
 */
export class SellerUnderwritingService {
  public static async processSellerIntake(payload: ISellerIntakePayload & any): Promise<ISellerOfferResult> {
    const startTime = Date.now();
    const cleanAddress = (payload.address || "").trim();
    const sellerSituation = payload.sellerSituation || payload.situation || "Direct Sale / Exploring Options";
    const propertyCondition = payload.propertyCondition || payload.conditionLevel || "Standard Updates";
    const desiredTimeline = payload.desiredTimeline || payload.timeline || "30-60 Days";
    const primaryPriority = payload.primaryPriority || payload.priority || "Fair Value";
    const fullName = payload.fullName || payload.sellerName || "Direct Property Owner";
    const email = payload.email || payload.sellerEmail || "";
    const phone = payload.phone || payload.sellerPhone || "";

    OcgObservability.log("SELLER_INTAKE_PROCESSING_STARTED", {
      address: cleanAddress,
      condition: propertyCondition,
      situation: sellerSituation,
    });

    const [publicRecord, comps] = await Promise.all([
      WichitaPropertyService.lookupPublicRecord({ address: cleanAddress }),
      this.fetchComparableSales(cleanAddress),
    ]);

    const isLiveVerifiedPropertyRecord = publicRecord?.provenance.mode === "LIVE_PUBLIC_RECORD";
    // Current comp provider is fixture-only. Flip this only when a separately verified
    // production closed-sale provider is implemented and its provenance is persisted.
    const hasLiveVerifiedClosedComps = false;

    const livingAreaSqft = publicRecord?.livingAreaSqft || this.estimateSqftFromType(propertyCondition);
    const yearBuilt = publicRecord?.yearBuilt || 1955;
    const propertyType = publicRecord?.zoningDescription || "Single Family Residential";
    const totalAppraised = publicRecord?.totalAppraisedValue || 135000;
    const parcelId = publicRecord?.parcelId;

    const { estimatedArv, arvConfidence } = this.calculateEstimatedArv(
      comps,
      publicRecord,
      livingAreaSqft,
      hasLiveVerifiedClosedComps,
    );

    const {
      estimatedRehabBudget,
      rehabBreakdown,
      repairConfidence,
      structuralRiskDetected,
    } = this.calculateRehabScope(
      { ...payload, propertyCondition, sellerSituation, desiredTimeline, primaryPriority },
      livingAreaSqft,
      yearBuilt,
    );

    const acquisitionMultiplier = 0.7;
    const grossArvCap = Math.round(estimatedArv * acquisitionMultiplier);
    const internalMaoCeiling = Math.max(0, grossArvCap - estimatedRehabBudget);

    const probateOrLegalFlag =
      sellerSituation.toLowerCase().includes("probate") ||
      sellerSituation.toLowerCase().includes("inherited") ||
      sellerSituation.toLowerCase().includes("estate");

    const propertyMatchConfidence = isLiveVerifiedPropertyRecord ? 0.95 : publicRecord ? 0.5 : 0.25;
    const compQualityScore = hasLiveVerifiedClosedComps
      ? comps.length >= 3
        ? 0.88
        : comps.length > 0
          ? 0.65
          : 0.3
      : comps.length > 0
        ? 0.35
        : 0.2;

    const confidenceGate = this.evaluateConfidenceGate({
      propertyMatchConfidence,
      compQualityScore,
      arvConfidence,
      repairEstimateConfidence: repairConfidence,
      dataFreshnessDays: isLiveVerifiedPropertyRecord && hasLiveVerifiedClosedComps ? 45 : 999,
      ownershipConsistency: !probateOrLegalFlag,
      structuralRiskDetected,
      probateOrLegalFlag,
      hasVerifiedPublicRecord: isLiveVerifiedPropertyRecord,
      hasVerifiedClosedComps: hasLiveVerifiedClosedComps,
    });

    const sellerOfferPresentation = this.buildOfferPresentation({
      confidenceGate,
      internalMaoCeiling,
      estimatedArv,
      estimatedRehabBudget,
      structuralRiskDetected,
      probateOrLegalFlag,
      cleanAddress,
    });

    const certaintyLevel: DataCertaintyLevel =
      isLiveVerifiedPropertyRecord && hasLiveVerifiedClosedComps
        ? confidenceGate.tier === "HIGH_CONFIDENCE"
          ? "ESTIMATED"
          : confidenceGate.tier === "MEDIUM_CONFIDENCE"
            ? "PROVISIONAL"
            : "PROFESSIONAL_VERIFICATION_REQ"
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
        zip: payload.zip || "67218",
        parcelId,
        livingAreaSqft,
        yearBuilt,
        propertyType,
        taxDistrict: publicRecord?.taxDistrict || "0101 WICHITA CITY",
        totalAppraisedValue: totalAppraised,
      },
      provenance: {
        recordsSource: isLiveVerifiedPropertyRecord
          ? publicRecord!.provenance.source
          : publicRecord
            ? "OCG representative Wichita staging fixture — not live county retrieval"
            : "Seller self-reported / unmatched address (unverified)",
        retrievalTimestamp: new Date().toISOString(),
        certaintyLevel,
      },
      internalUnderwriting: {
        estimatedArv,
        acquisitionMultiplier,
        grossArvCap,
        estimatedRehabBudget,
        rehabBreakdown,
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
      propertyDataMode: publicRecord?.provenance.mode || "UNMATCHED",
      closedCompMode: hasLiveVerifiedClosedComps ? "VERIFIED_LIVE" : "STAGING_FIXTURE",
      durationMs: Date.now() - startTime,
    });

    return result;
  }

  /**
   * Representative comparable-sale fixtures for workflow testing only.
   * These are intentionally labelled so UI/API consumers cannot mistake them
   * for a verified current closed-sale feed.
   */
  private static async fetchComparableSales(address: string): Promise<IComparableSale[]> {
    const upper = address.toUpperCase();
    const source = "REPRESENTATIVE_STAGING_FIXTURE — NOT VERIFIED CLOSED SALE";

    if (upper.includes("RUTAN") || upper.includes("COLLEGE HILL") || upper.includes("67218")) {
      return [
        {
          id: "fixture_comp_1",
          address: "Representative College Hill Comparable A",
          distanceMiles: 0.1,
          salePrice: 242000,
          saleDate: "2026-06-14",
          sqft: 1680,
          pricePerSqft: 144.05,
          yearBuilt: 1934,
          similarityScore: 0.94,
          source,
        },
        {
          id: "fixture_comp_2",
          address: "Representative College Hill Comparable B",
          distanceMiles: 0.25,
          salePrice: 238500,
          saleDate: "2026-05-22",
          sqft: 1590,
          pricePerSqft: 150,
          yearBuilt: 1930,
          similarityScore: 0.91,
          source,
        },
        {
          id: "fixture_comp_3",
          address: "Representative College Hill Comparable C",
          distanceMiles: 0.35,
          salePrice: 249000,
          saleDate: "2026-07-02",
          sqft: 1720,
          pricePerSqft: 144.77,
          yearBuilt: 1938,
          similarityScore: 0.88,
          source,
        },
      ];
    }

    if (upper.includes("GLENDALE") || upper.includes("CROWN HEIGHTS") || upper.includes("67208")) {
      return [
        {
          id: "fixture_comp_4",
          address: "Representative Crown Heights Comparable A",
          distanceMiles: 0.12,
          salePrice: 268000,
          saleDate: "2026-04-18",
          sqft: 1850,
          pricePerSqft: 144.86,
          yearBuilt: 1962,
          similarityScore: 0.92,
          source,
        },
        {
          id: "fixture_comp_5",
          address: "Representative Crown Heights Comparable B",
          distanceMiles: 0.3,
          salePrice: 262000,
          saleDate: "2026-06-29",
          sqft: 1790,
          pricePerSqft: 146.37,
          yearBuilt: 1960,
          similarityScore: 0.89,
          source,
        },
      ];
    }

    if (upper.includes("DELANO") || upper.includes("67203")) {
      return [
        {
          id: "fixture_comp_6",
          address: "Representative Delano Comparable A",
          distanceMiles: 0.15,
          salePrice: 192000,
          saleDate: "2026-05-11",
          sqft: 1250,
          pricePerSqft: 153.6,
          yearBuilt: 1925,
          similarityScore: 0.93,
          source,
        },
      ];
    }

    return [
      {
        id: "fixture_comp_general_1",
        address: "Representative Wichita Submarket Comparable",
        distanceMiles: 0.6,
        salePrice: 215000,
        saleDate: "2026-05-30",
        sqft: 1500,
        pricePerSqft: 143.33,
        yearBuilt: 1950,
        similarityScore: 0.78,
        source,
      },
    ];
  }

  private static calculateEstimatedArv(
    comps: IComparableSale[],
    publicRecord: WichitaPublicPropertyRecord | null,
    livingAreaSqft: number,
    hasVerifiedClosedComps: boolean,
  ): { estimatedArv: number; arvConfidence: number } {
    if (comps.length > 0) {
      const weightedPpsqft =
        comps.reduce((acc, c) => acc + c.pricePerSqft * c.similarityScore, 0) /
        comps.reduce((acc, c) => acc + c.similarityScore, 0);
      const arv = Math.round((weightedPpsqft * livingAreaSqft) / 1000) * 1000;

      if (!hasVerifiedClosedComps) {
        return { estimatedArv: arv, arvConfidence: 0.35 };
      }

      const arvConfidence = comps.length >= 3 ? 0.9 : comps.length === 2 ? 0.8 : 0.65;
      return { estimatedArv: arv, arvConfidence };
    }

    const baseVal = publicRecord?.totalAppraisedValue ? publicRecord.totalAppraisedValue * 1.35 : 185000;
    const arv = Math.round(baseVal / 1000) * 1000;
    return { estimatedArv: arv, arvConfidence: 0.25 };
  }

  private static calculateRehabScope(payload: ISellerIntakePayload, sqft: number, yearBuilt: number) {
    let baseRatePerSqft = 22;
    let structuralRiskDetected = false;
    let repairConfidence = 0.85;

    switch (payload.propertyCondition) {
      case "Move-In Ready":
        baseRatePerSqft = 10;
        repairConfidence = 0.9;
        break;
      case "Dated / Needs Updates":
        baseRatePerSqft = 25;
        repairConfidence = 0.85;
        break;
      case "Needs Major Cosmetic & Mechanical Rehab":
        baseRatePerSqft = 38;
        repairConfidence = 0.8;
        break;
      case "Full Gut / Major Deferred Maintenance":
        baseRatePerSqft = 55;
        repairConfidence = 0.7;
        break;
      case "Severe Structural / Fire Damage":
        baseRatePerSqft = 80;
        structuralRiskDetected = true;
        repairConfidence = 0.4;
        break;
    }

    if (yearBuilt < 1960) baseRatePerSqft += 4;

    let knownRepairsAddon = 0;
    if (payload.knownRepairs && payload.knownRepairs.length > 0) {
      payload.knownRepairs.forEach((rep) => {
        if (rep.includes("Roof")) knownRepairsAddon += 8500;
        if (rep.includes("HVAC")) knownRepairsAddon += 6800;
        if (rep.includes("Foundation")) {
          knownRepairsAddon += 12000;
          structuralRiskDetected = true;
        }
        if (rep.includes("Plumbing")) knownRepairsAddon += 5500;
      });
    }

    const baseRehab = sqft * baseRatePerSqft + knownRepairsAddon;
    const contingencyReserves = Math.round(baseRehab * 0.15);
    const totalRehab = Math.round((baseRehab + contingencyReserves) / 500) * 500;

    return {
      estimatedRehabBudget: totalRehab,
      rehabBreakdown: {
        exteriorRoof: Math.round(totalRehab * 0.3),
        interiorCosmetic: Math.round(totalRehab * 0.35),
        mechanicalsHvac: Math.round(totalRehab * 0.2),
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
    hasVerifiedPublicRecord: boolean;
    hasVerifiedClosedComps: boolean;
  }): IOfferConfidenceGate {
    const reasons: string[] = [];
    const requiredVerifications: string[] = [];

    const compositeScore = Number(
      (
        params.propertyMatchConfidence * 0.25 +
        params.compQualityScore * 0.3 +
        params.arvConfidence * 0.25 +
        params.repairEstimateConfidence * 0.2
      ).toFixed(2),
    );

    if (!params.hasVerifiedPublicRecord) {
      reasons.push("Live public parcel records have not been verified for this submission.");
      requiredVerifications.push("Sedgwick County parcel and ownership verification");
    }
    if (!params.hasVerifiedClosedComps) {
      reasons.push("Verified current closed-sale comparables are not connected in this environment.");
      requiredVerifications.push("Current closed-sale comparable verification");
    }
    if (params.structuralRiskDetected) {
      reasons.push("Structural or fire-damage flags require professional on-site inspection.");
      requiredVerifications.push("Licensed structural / foundation inspection");
    }
    if (params.probateOrLegalFlag) {
      reasons.push("Estate / probate context requires representative-authority and title verification.");
      requiredVerifications.push("Title company estate authorization verification");
    }

    let tier: IOfferConfidenceGate["tier"] = "HIGH_CONFIDENCE";
    if (
      !params.hasVerifiedPublicRecord ||
      !params.hasVerifiedClosedComps ||
      params.structuralRiskDetected ||
      compositeScore < 0.55
    ) {
      tier = "HUMAN_REVIEW_REQUIRED";
    } else if (compositeScore < 0.78 || params.probateOrLegalFlag || params.compQualityScore < 0.75) {
      tier = "MEDIUM_CONFIDENCE";
      if (params.compQualityScore < 0.75) {
        reasons.push("Micro-market comp density is limited; on-site condition assessment is recommended.");
      }
      requiredVerifications.push("Physical walkthrough to verify finishes and mechanicals");
    } else {
      reasons.push("Verified source thresholds meet the preliminary-offer confidence gate.");
      requiredVerifications.push("Standard preliminary title search and physical walkthrough");
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
      requiredHumanVerifications: [...new Set(requiredVerifications)],
    };
  }

  private static buildOfferPresentation(params: {
    confidenceGate: IOfferConfidenceGate;
    internalMaoCeiling: number;
    estimatedArv: number;
    estimatedRehabBudget: number;
    structuralRiskDetected: boolean;
    probateOrLegalFlag: boolean;
    cleanAddress: string;
  }): ISellerOfferResult["sellerOfferPresentation"] {
    const { confidenceGate, internalMaoCeiling } = params;

    const baseDisclaimer =
      "This preliminary property review is non-binding. Any figures shown require verified property records, current market evidence, physical condition review, clear marketable title, and mutual written agreement. It is not an appraisal, purchase contract, or guarantee of funds.";

    if (confidenceGate.tier === "HIGH_CONFIDENCE") {
      const minOffer = Math.round((internalMaoCeiling * 0.96) / 1000) * 1000;
      const maxOffer = Math.round((internalMaoCeiling * 1.03) / 1000) * 1000;
      return {
        status: "PRELIMINARY_OFFER_AVAILABLE",
        headline: "Preliminary OCG Acquisition Range Available",
        offerRangeMin: minOffer,
        offerRangeMax: maxOffer,
        singlePointEstimate: internalMaoCeiling,
        displayTerms: {
          isBinding: false,
          asIsCondition: true,
          commissionFree: true,
          subjectToWalkthrough: true,
          subjectToTitleReview: true,
        },
        explanation: {
          whatOcgReviewed: [
            "Verified property-record evidence",
            "Verified current closed-sale comparable evidence",
            "Reported condition against preliminary renovation unit rates",
            "70% acquisition screening framework",
          ],
          whatRemainsToBeVerified: [
            "Physical walkthrough to confirm interior layout and major-system condition",
            "Preliminary title review for marketable transfer",
          ],
          nextSteps: [
            "Review the preliminary range with OCG",
            "Schedule a no-obligation property walkthrough",
            "If both parties want to proceed, OCG may prepare written acquisition terms for review",
          ],
        },
        legalDisclaimer: baseDisclaimer,
      };
    }

    if (confidenceGate.tier === "MEDIUM_CONFIDENCE") {
      const minEstimate = Math.round((internalMaoCeiling * 0.9) / 1000) * 1000;
      const maxEstimate = Math.round((internalMaoCeiling * 1.05) / 1000) * 1000;
      return {
        status: "PRELIMINARY_ESTIMATE",
        headline: "Preliminary Acquisition Estimate — Verification Required",
        offerRangeMin: minEstimate,
        offerRangeMax: maxEstimate,
        singlePointEstimate: internalMaoCeiling,
        displayTerms: {
          isBinding: false,
          asIsCondition: true,
          commissionFree: true,
          subjectToWalkthrough: true,
          subjectToTitleReview: true,
        },
        explanation: {
          whatOcgReviewed: [
            "Available property and submarket evidence",
            "Preliminary price-per-square-foot benchmarks",
            "Reported seller circumstances and condition notes",
          ],
          whatRemainsToBeVerified: [
            "Current market evidence and property-record details",
            "Mechanical, structural, and renovation scope",
            "Title / legal authority where applicable",
          ],
          nextSteps: [
            "Review preliminary figures with OCG",
            "Schedule a no-obligation on-site walkthrough",
            "Proceed to written terms only after required verification",
          ],
        },
        legalDisclaimer: baseDisclaimer,
      };
    }

    return {
      status: "ADDITIONAL_REVIEW_REQUIRED",
      headline: "Additional Property Review Required",
      displayTerms: {
        isBinding: false,
        asIsCondition: true,
        commissionFree: true,
        subjectToWalkthrough: true,
        subjectToTitleReview: true,
      },
      explanation: {
        whatOcgReviewed: [
          "Address submission and seller-provided property context",
          "Preliminary internal screening using representative workflow data where available",
        ],
        whatRemainsToBeVerified: [
          ...confidenceGate.reasonsForTier,
          "Human acquisition review before any seller-facing dollar range is produced",
        ],
        nextSteps: [
          "OCG reviews the property evidence and missing verification items",
          "OCG contacts the seller using the requested contact information",
          "No dollar range is manufactured while required evidence is unverified",
        ],
      },
      legalDisclaimer: baseDisclaimer,
    };
  }

  private static estimateSqftFromType(_condition: string): number {
    return 1500;
  }
}
