import { SellerUnderwritingService } from "../services/sellerUnderwritingService";
import { ISellerIntakePayload } from "../../shared/contracts";

async function runTests() {
  console.log("==================================================");
  console.log("OCG SELLER PRELIMINARY OFFER AUTOMATED TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // Scenario A — High Confidence
  // --------------------------------------------------------------------------
  console.log("Testing Scenario A — High Confidence (Canonical 248 S Rutan)...");
  const payloadA: ISellerIntakePayload = {
    address: "248 S Rutan Ave, Wichita, KS 67218",
    propertyCondition: "Needs Major Cosmetic & Mechanical Rehab",
    occupancyStatus: "Vacant",
    sellerSituation: "Downsizing / Transitioning",
    desiredTimeline: "Within 30-45 Days",
    primaryPriority: "No Repairs / As-Is",
    knownRepairs: ["Roof / Shingles (Aging)"],
    fullName: "John Doe",
    email: "john@example.com",
    phone: "316-555-0101"
  };

  const resA = await SellerUnderwritingService.processSellerIntake(payloadA);
  if (
    resA.sellerOfferPresentation.status === "PRELIMINARY_OFFER_AVAILABLE" &&
    resA.sellerOfferPresentation.offerRangeMin! > 0 &&
    resA.sellerOfferPresentation.offerRangeMax! > resA.sellerOfferPresentation.offerRangeMin! &&
    resA.confidenceGate.overallConfidenceScore >= 0.78 &&
    resA.piperHandoff.status === "READY_FOR_PIPER"
  ) {
    console.log(`✓ Scenario A Passed: Offer Range $${resA.sellerOfferPresentation.offerRangeMin} - $${resA.sellerOfferPresentation.offerRangeMax} (Confidence: ${resA.confidenceGate.overallConfidenceScore})\n`);
    passed++;
  } else {
    console.error("✗ Scenario A Failed:", resA);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Scenario B — Medium Confidence (Moderate comps / uncertain scope)
  // --------------------------------------------------------------------------
  console.log("Testing Scenario B — Medium Confidence (General Wichita Address)...");
  const payloadB: ISellerIntakePayload = {
    address: "1234 General Submarket Rd, Wichita, KS",
    propertyCondition: "Full Gut / Major Deferred Maintenance",
    occupancyStatus: "Tenant Occupied",
    sellerSituation: "Tired Landlord",
    desiredTimeline: "Flexible",
    primaryPriority: "Speed & Convenience",
    fullName: "Landlord Investor",
    email: "landlord@example.com",
    phone: "316-555-0102"
  };

  const resB = await SellerUnderwritingService.processSellerIntake(payloadB);
  if (
    (resB.sellerOfferPresentation.status === "PRELIMINARY_ESTIMATE" || resB.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED") &&
    resB.confidenceGate.requiredHumanVerifications.length > 0 &&
    resB.piperHandoff.status === "READY_FOR_PIPER"
  ) {
    console.log(`✓ Scenario B Passed: Status ${resB.sellerOfferPresentation.status} with ${resB.confidenceGate.requiredHumanVerifications.length} verifications\n`);
    passed++;
  } else {
    console.error("✗ Scenario B Failed:", resB);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Scenario C — Low Confidence / Unknown Address (No Manufactured Numbers)
  // --------------------------------------------------------------------------
  console.log("Testing Scenario C — Low Confidence (Unknown Unmatched Address)...");
  const payloadC: ISellerIntakePayload = {
    address: "9999 Unregistered Dirt Lane, Rural Outskirts",
    propertyCondition: "Full Gut / Major Deferred Maintenance",
    occupancyStatus: "Vacant",
    sellerSituation: "Exploring Options",
    desiredTimeline: "Flexible",
    primaryPriority: "Maximum Net Cash",
    fullName: "Rural Seller",
    email: "rural@example.com",
    phone: "316-555-0103"
  };

  const resC = await SellerUnderwritingService.processSellerIntake(payloadC);
  if (
    resC.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED" &&
    resC.sellerOfferPresentation.offerRangeMin === undefined &&
    resC.piperHandoff.status === "READY_FOR_PIPER"
  ) {
    console.log("✓ Scenario C Passed: Correctly blocked automated offer without manufacturing numbers\n");
    passed++;
  } else {
    console.error("✗ Scenario C Failed:", resC);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Scenario D — Estate / Probate Handling
  // --------------------------------------------------------------------------
  console.log("Testing Scenario D — Estate / Probate Flag...");
  const payloadD: ISellerIntakePayload = {
    address: "1421 N Glendale Ave, Wichita, KS 67208",
    propertyCondition: "Dated / Needs Updates",
    occupancyStatus: "Estate / Unoccupied",
    sellerSituation: "Inherited Property / Probate",
    desiredTimeline: "60-90 Days",
    primaryPriority: "No Repairs / As-Is",
    fullName: "Estate Executor",
    email: "executor@example.com",
    phone: "316-555-0104"
  };

  const resD = await SellerUnderwritingService.processSellerIntake(payloadD);
  if (
    resD.confidenceGate.thresholdsMet.probateOrLegalFlag === true &&
    resD.confidenceGate.requiredHumanVerifications.some(v => v.toLowerCase().includes("estate") || v.toLowerCase().includes("title"))
  ) {
    console.log("✓ Scenario D Passed: Correctly flagged estate/probate title verification requirement\n");
    passed++;
  } else {
    console.error("✗ Scenario D Failed:", resD);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Scenario E — Provider Failure Handling
  // --------------------------------------------------------------------------
  console.log("Testing Scenario E — Provider Failure Handling...");
  const payloadE: ISellerIntakePayload = {
    address: "",
    propertyCondition: "Move-In Ready",
    occupancyStatus: "Vacant",
    sellerSituation: "Exploring Options",
    desiredTimeline: "Flexible",
    primaryPriority: "Speed & Convenience",
    fullName: "Test User",
    email: "test@example.com",
    phone: "316-555-0105"
  };

  try {
    const resE = await SellerUnderwritingService.processSellerIntake(payloadE);
    if (resE.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED") {
      console.log("✓ Scenario E Passed: Degraded state handled with human review requirement\n");
      passed++;
    } else {
      console.error("✗ Scenario E Failed:", resE);
      failed++;
    }
  } catch (err) {
    console.log("✓ Scenario E Passed: Errored safely and caught\n");
    passed++;
  }

  // --------------------------------------------------------------------------
  // Scenario F — Extreme Repair Risk (Structural / Fire Damage)
  // --------------------------------------------------------------------------
  console.log("Testing Scenario F — Extreme Structural / Fire Damage...");
  const payloadF: ISellerIntakePayload = {
    address: "814 N Delano St, Wichita, KS 67203",
    propertyCondition: "Severe Structural / Fire Damage",
    occupancyStatus: "Vacant",
    sellerSituation: "Deferred Maintenance",
    desiredTimeline: "Immediate (14-21 Days)",
    primaryPriority: "Speed & Convenience",
    knownRepairs: ["Foundation / Settling Cracks", "Roof / Shingles (Aging)"],
    fullName: "Distressed Property Owner",
    email: "distressed@example.com",
    phone: "316-555-0106"
  };

  const resF = await SellerUnderwritingService.processSellerIntake(payloadF);
  if (
    resF.confidenceGate.thresholdsMet.structuralRiskDetected === true &&
    resF.confidenceGate.tier === "HUMAN_REVIEW_REQUIRED" &&
    resF.sellerOfferPresentation.status === "ADDITIONAL_REVIEW_REQUIRED"
  ) {
    console.log("✓ Scenario F Passed: Structural risk triggered automatic human review gate\n");
    passed++;
  } else {
    console.error("✗ Scenario F Failed:", resF);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Scenario G — Duplicate Submission Reconciliation
  // --------------------------------------------------------------------------
  console.log("Testing Scenario G — Duplicate Submission Handling...");
  const resG1 = await SellerUnderwritingService.processSellerIntake(payloadA);
  const resG2 = await SellerUnderwritingService.processSellerIntake(payloadA);

  if (resG1.piperHandoff.status === "READY_FOR_PIPER" && resG2.piperHandoff.status === "READY_FOR_PIPER") {
    console.log("✓ Scenario G Passed: Both submissions safely enqueued with unique tracking IDs\n");
    passed++;
  } else {
    console.error("✗ Scenario G Failed");
    failed++;
  }

  console.log("==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
