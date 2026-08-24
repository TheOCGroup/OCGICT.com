import {
  IHunterAdapterRequest,
  IHunterAdapterResponse,
  IVictorAdapterRequest,
  IVictorAdapterResponse,
  IPiperAdapterRequest,
  IPiperAdapterResponse,
} from "../../shared/contracts";
import { OcgObservability } from "./observability.js";

/**
 * HUNTER Adapter — Acquisition Signal Discovery
 */
export class HunterAdapter {
  static async querySignals(req: IHunterAdapterRequest): Promise<IHunterAdapterResponse> {
    const startTime = Date.now();
    OcgObservability.log("HUNTER_ADAPTER_INVOKED", { req });

    // When backend service is not running or credentials are not configured,
    // return an explicit SPECIFICATION_MOCK response conforming to the contract.
    const response: IHunterAdapterResponse = {
      status: "SPECIFICATION_MOCK",
      signalsFound: [
        {
          signalId: "SIG_WIC_08812",
          address: "248 S Rutan St, Wichita, KS 67218",
          neighborhood: "College Hill",
          distressVector: req.distressVector || "Deferred Exterior Maintenance",
          marketDeltaPercent: -28.4,
          priorityScore: 88,
        },
        {
          signalId: "SIG_WIC_08819",
          address: "1421 N Glendale Ave, Wichita, KS 67208",
          neighborhood: "Crown Heights Area",
          distressVector: "Tax Delinquency",
          marketDeltaPercent: -34.1,
          priorityScore: 92,
        },
      ],
      retrievalTimestamp: new Date().toISOString(),
      upstreamService: "HUNTER_CORE_V1",
    };

    OcgObservability.log("HUNTER_ADAPTER_INVOKED", { status: response.status, count: response.signalsFound.length }, Date.now() - startTime);
    return response;
  }
}

/**
 * VICTOR Adapter — Underwriting & Scope Engine
 */
export class VictorAdapter {
  static async underwriteDeal(req: IVictorAdapterRequest): Promise<IVictorAdapterResponse> {
    const startTime = Date.now();
    OcgObservability.log("VICTOR_ADAPTER_INVOKED", { address: req.propertyAddress, sqft: req.sqft });

    const computedArv = Math.round(req.sqft * 145);
    const rehabRate = req.observedConditionTier === "Light Cosmetic" ? 22 : req.observedConditionTier === "Standard Renovation" ? 32 : 48;
    const totalRehab = Math.round(req.sqft * rehabRate);
    const mao = Math.max(Math.round(computedArv * 0.70) - totalRehab, 0);
    const projectedRent = Math.round(computedArv * 0.0082);
    const estimatedPiti = Math.round(mao * 0.0078 + 350);
    const coverageRatio = Number((projectedRent / estimatedPiti).toFixed(2));

    const response: IVictorAdapterResponse = {
      status: "SPECIFICATION_MOCK",
      underwritingRecord: {
        id: `prop_${Date.now()}`,
        address: req.propertyAddress,
        city: "Wichita",
        state: "KS",
        zip: "67208",
        propertyType: {
          value: "Single Family Craftsman",
          certainty: "PROVISIONAL",
          source: "Intake Estimator",
          retrievalTimestamp: new Date().toISOString(),
        },
        sqft: {
          value: req.sqft,
          certainty: "KNOWN",
          source: "Client Provided / Sedgwick County Public Record",
          retrievalTimestamp: new Date().toISOString(),
        },
        yearBuilt: {
          value: req.yearBuilt,
          certainty: "KNOWN",
          source: "Public Record",
          retrievalTimestamp: new Date().toISOString(),
        },
        bedrooms: {
          value: 3,
          certainty: "PROVISIONAL",
          source: "Listing / County Profile",
          retrievalTimestamp: new Date().toISOString(),
        },
        bathrooms: {
          value: 2,
          certainty: "PROVISIONAL",
          source: "Listing / County Profile",
          retrievalTimestamp: new Date().toISOString(),
        },
        arvRetailEstimate: {
          value: computedArv,
          certainty: "ESTIMATED",
          source: "VICTOR 0.5-Mile Comp Clustering Heuristic",
          retrievalTimestamp: new Date().toISOString(),
          confidenceScore: 0.84,
        },
        rehabScopeEstimate: {
          value: totalRehab,
          certainty: "ESTIMATED",
          source: "Wichita Rate Table ($/sqft)",
          retrievalTimestamp: new Date().toISOString(),
        },
        maximumAllowableOffer: {
          value: mao,
          certainty: "ESTIMATED",
          source: "70% Rule Formula: (ARV * 0.70) - Rehab",
          retrievalTimestamp: new Date().toISOString(),
        },
        projectedMonthlyRent: {
          value: projectedRent,
          certainty: "ESTIMATED",
          source: "Wichita Submarket Rental Comp Matrix",
          retrievalTimestamp: new Date().toISOString(),
        },
        foundationInspectionStatus: "PROFESSIONAL_VERIFICATION_REQ",
        roofAgeAndCondition: "PROFESSIONAL_VERIFICATION_REQ",
        mepSystemsCondition: "PROFESSIONAL_VERIFICATION_REQ",
        floodPlainZone: {
          value: "Zone X (Unshaded / Minimal Risk)",
          certainty: "KNOWN",
          source: "FEMA / Sedgwick County GIS",
          retrievalTimestamp: new Date().toISOString(),
        },
        taxDelinquencyStatus: {
          value: "Current",
          certainty: "KNOWN",
          source: "Sedgwick County Treasurer",
          retrievalTimestamp: new Date().toISOString(),
        },
      },
      rehabBreakdown: {
        exteriorAndRoof: Math.round(totalRehab * 0.35),
        kitchensAndBaths: Math.round(totalRehab * 0.38),
        mechanicals: Math.round(totalRehab * 0.15),
        contingencyReserve: Math.round(totalRehab * 0.12),
        totalRehab,
      },
      maoCeiling: mao,
      dscrRefiFeasibility: {
        projectedRent,
        estimatedPiti,
        coverageRatio,
        qualifiesForDscr: coverageRatio >= 1.20,
      },
      underwritingConfidenceScore: 86,
    };

    OcgObservability.log("VICTOR_ADAPTER_INVOKED", { mao, totalRehab, status: response.status }, Date.now() - startTime);
    return response;
  }
}

/**
 * PIPER Adapter — Acquisition Pipeline Ingestion
 */
export class PiperAdapter {
  static async ingestStrategyBrief(req: IPiperAdapterRequest): Promise<IPiperAdapterResponse> {
    const startTime = Date.now();
    OcgObservability.log("PIPER_ADAPTER_INVOKED", { briefId: req.strategyBrief.id });

    const response: IPiperAdapterResponse = {
      status: "SPECIFICATION_MOCK",
      piperTrackingId: `PIP_DEAL_${Date.now()}`,
      dealStage: "1. Intake & Initial Triage",
      assignedWorkflow:
        req.strategyBrief.clientContext.investorStage.value === "Seller / Disposing"
          ? "Seller Direct Review"
          : "Investor Strategy Assessment",
      ingestionTimestamp: new Date().toISOString(),
    };

    OcgObservability.log("PIPER_ADAPTER_INVOKED", { trackingId: response.piperTrackingId }, Date.now() - startTime);
    return response;
  }
}
