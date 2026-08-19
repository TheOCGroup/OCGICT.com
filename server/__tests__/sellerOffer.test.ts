import { SellerUnderwritingService } from "../services/sellerUnderwritingService";
import { ISellerIntakePayload } from "../../shared/contracts";

async function runTests() {
  console.log("==================================================");
  console.log("OCG SELLER ACQUISITION REGRESSION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const expect = (condition: boolean, label: string, details?: unknown) => {
    if (condition) {
      console.log(`✓ ${label}`);
      passed++;
    } else {
      console.error(`✗ ${label}`, details ?? "");
      failed++;
    }
  };

  const base: ISellerIntakePayload = {
    address: "248 S Rutan Ave, Wichita, KS 67218",
    propertyCondition: "Needs Major Cosmetic & Mechanical Rehab",
    occupancyStatus: "Vacant",
    sellerSituation: "Downsizing / Transitioning",
    desiredTimeline: "Within 30-45 Days",
    primaryPriority: "No Repairs / As-Is",
    knownRepairs: ["Roof / Shingles (Aging)"],
    fullName: "QA Seller",
    email: "qa@example.com",
    phone: "316-555-0101",
  };

  // A — No-pretending gate: staging fixtures must never produce a seller dollar range.
  const resA = await SellerUnderwritingService.processSellerIntake(base);
  expect(
    resA.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED" &&
      resA.sellerOfferPresentation.offerRangeMin === undefined &&
      resA.sellerOfferPresentation.offerRangeMax === undefined &&
      resA.confidenceGate.tier === "HUMAN_REVIEW_REQUIRED",
    "Scenario A: staging fixture blocks seller-facing offer range",
    resA,
  );

  expect(
    resA.provenance.certaintyLevel === "PROFESSIONAL_VERIFICATION_REQ" &&
      resA.provenance.recordsSource.toLowerCase().includes("staging fixture"),
    "Scenario B: fixture provenance remains explicit and unverified",
    resA.provenance,
  );

  expect(
    resA.comparableSales.every((comp) => comp.source.includes("NOT VERIFIED CLOSED SALE")),
    "Scenario C: representative comps cannot masquerade as verified closed sales",
    resA.comparableSales,
  );

  // D — Unknown address still fails honestly without a manufactured number.
  const resD = await SellerUnderwritingService.processSellerIntake({
    ...base,
    address: "9999 Unregistered Dirt Lane, Rural Outskirts",
  });
  expect(
    resD.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED" &&
      resD.sellerOfferPresentation.offerRangeMin === undefined,
    "Scenario D: unmatched address fails safely with no manufactured range",
    resD,
  );

  // E — Probate/legal context stays gated and requires title/authority verification.
  const resE = await SellerUnderwritingService.processSellerIntake({
    ...base,
    address: "1421 N Glendale Ave, Wichita, KS 67208",
    sellerSituation: "Inherited Property / Probate",
    occupancyStatus: "Estate / Unoccupied",
  });
  expect(
    resE.confidenceGate.thresholdsMet.probateOrLegalFlag === true &&
      resE.confidenceGate.requiredHumanVerifications.some((item) =>
        item.toLowerCase().includes("estate") || item.toLowerCase().includes("title"),
      ),
    "Scenario E: probate/title verification gate remains intact",
    resE.confidenceGate,
  );

  // F — Structural/fire risk remains a hard human-review gate.
  const resF = await SellerUnderwritingService.processSellerIntake({
    ...base,
    address: "814 N Delano St, Wichita, KS 67203",
    propertyCondition: "Severe Structural / Fire Damage",
    knownRepairs: ["Foundation / Settling Cracks", "Roof / Shingles (Aging)"],
  });
  expect(
    resF.confidenceGate.thresholdsMet.structuralRiskDetected === true &&
      resF.confidenceGate.tier === "HUMAN_REVIEW_REQUIRED" &&
      resF.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED",
    "Scenario F: structural/fire risk requires human review",
    resF.confidenceGate,
  );

  // G — Every accepted intake still creates an actionable PIPER handoff.
  expect(
    [resA, resD, resE, resF].every(
      (result) =>
        result.piperHandoff.status === "READY_FOR_PIPER" &&
        Boolean(result.piperHandoff.outboxTrackingId),
    ),
    "Scenario G: guarded seller submissions still create PIPER handoffs",
  );

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
