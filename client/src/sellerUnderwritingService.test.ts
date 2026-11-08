import { afterEach, describe, expect, it, vi } from "vitest";
import { SellerUnderwritingService } from "../../server/services/sellerUnderwritingService.js";

const priorMode = process.env.OCGICT_DATA_MODE;
const priorProvider = process.env.OCGICT_SEDGWICK_GIS_ENABLED;

const payload = (address: string) => ({
  address,
  city: "Derby",
  state: "KS",
  zip: "67037",
  propertyCondition: "Dated / Needs Updates" as const,
  occupancyStatus: "Owner Occupied" as const,
  sellerSituation: "Exploring Options" as const,
  desiredTimeline: "Flexible" as const,
  primaryPriority: "No Repairs / As-Is" as const,
  fullName: "QA Seller",
  email: "qa@example.invalid",
  phone: "555-0100",
});

afterEach(() => {
  if (priorMode === undefined) delete process.env.OCGICT_DATA_MODE;
  else process.env.OCGICT_DATA_MODE = priorMode;
  if (priorProvider === undefined) delete process.env.OCGICT_SEDGWICK_GIS_ENABLED;
  else process.env.OCGICT_SEDGWICK_GIS_ENABLED = priorProvider;
  vi.unstubAllGlobals();
});

describe("Seller underwriting evidence gates", () => {
  it("returns human review when the parcel provider is not activated", async () => {
    process.env.OCGICT_DATA_MODE = "production";
    delete process.env.OCGICT_SEDGWICK_GIS_ENABLED;

    const result = await SellerUnderwritingService.processSellerIntake(payload("777 Test Street, Derby, KS 67037"));
    expect(result.propertyResolution?.status).toBe("provider_unavailable");
    expect(result.property.city).toBe("Derby");
    expect(result.property.state).toBe("KS");
    expect(result.property.zip).toBe("67037");
    expect(result.comparableSales).toHaveLength(0);
    expect(result.internalUnderwriting.estimatedArv).toBe(0);
    expect(result.internalUnderwriting.internalMaoCeiling).toBe(0);
    expect(result.sellerOfferPresentation.status).toBe("ADDITIONAL_REVIEW_REQUIRED");
    expect(result.confidenceGate.tier).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.confidenceGate.reasonsForTier).toContain("Title and ownership consistency have not been independently verified.");
  });

  it("never substitutes illustrative College Hill examples for live sold comps in production", async () => {
    process.env.OCGICT_DATA_MODE = "production";
    delete process.env.OCGICT_SEDGWICK_GIS_ENABLED;

    const result = await SellerUnderwritingService.processSellerIntake(payload("248 S Rutan Ave, Wichita, KS 67218"));
    expect(result.comparableSales).toHaveLength(0);
    expect(result.internalUnderwriting.estimatedArv).toBe(0);
    expect(result.internalUnderwriting.internalMaoCeiling).toBe(0);
    expect(result.sellerOfferPresentation.status).toBe("ADDITIONAL_REVIEW_REQUIRED");
    expect(result.confidenceGate.tier).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.confidenceGate.requiredHumanVerifications).toContain("Run live comparable-sale review");
  });
  it("does not create an automated offer from parcel appraisal facts without verified comps", async () => {
    process.env.OCGICT_DATA_MODE = "production";
    process.env.OCGICT_SEDGWICK_GIS_ENABLED = "true";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      features: [{
        attributes: {
          PIN: "TEST0003", Prop_Addr: "778 TEST ST", Prop_City: "DERBY", Prop_zip: "67037",
          LandVal: 25000, ImprVal: 90000, TotVal: 115000, YrBuilt: 1960, SFLA: 1250,
          BedRooms: 3, FullBath: 1, HalfBath: 1, FunctionDs: "Single Family Residential",
        },
      }],
    }), { status: 200 })));

    const result = await SellerUnderwritingService.processSellerIntake(payload("778 Test Street, Derby, KS 67037"));
    expect(result.propertyResolution?.status).toBe("matched");
    expect(result.property.parcelId).toBe("TEST0003");
    expect(result.property.city).toBe("DERBY");
    expect(result.property.totalAppraisedValue).toBe(115000);
    expect(result.comparableSales).toHaveLength(0);
    expect(result.internalUnderwriting.estimatedArv).toBe(0);
    expect(result.internalUnderwriting.internalMaoCeiling).toBe(0);
    expect(result.sellerOfferPresentation.status).toBe("ADDITIONAL_REVIEW_REQUIRED");
    expect(result.confidenceGate.tier).toBe("HUMAN_REVIEW_REQUIRED");
    expect(result.confidenceGate.reasonsForTier).toContain("Title and ownership consistency have not been independently verified.");
  });
});
