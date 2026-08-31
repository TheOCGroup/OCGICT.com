import { EnhancedLocalProvider } from "../services/streamingModelProvider.js";

async function complete(message: string) {
  const provider = new EnhancedLocalProvider();
  return provider.generateCompletion({
    messages: [
      { role: "system", content: "Test system instruction" },
      { role: "user", content: message },
    ],
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, name: string, detail?: unknown) => {
    if (condition) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.error(`✗ ${name}`, detail ?? "");
      failed++;
    }
  };

  console.log("==================================================");
  console.log("OCG G FALLBACK EVIDENCE-SAFETY REGRESSION SUITE");
  console.log("==================================================");

  const missingInputs = await complete("Can you calculate the 70% MAO for this property?");
  assert(
    !missingInputs.toolCalls?.length &&
      /will not invent/i.test(missingInputs.content) &&
      !missingInputs.content.includes("240,000") &&
      !missingInputs.content.includes("45,000"),
    "Missing MAO inputs do not trigger fabricated values",
    missingInputs,
  );

  const explicitInputs = await complete("ARV is $300,000 and rehab is $50,000. Calculate the 70% MAO.");
  assert(
    explicitInputs.content.includes("160,000") &&
      explicitInputs.toolCalls?.[0]?.name === "set_calculator_values" &&
      explicitInputs.toolCalls?.[0]?.arguments?.arv === 300000 &&
      explicitInputs.toolCalls?.[0]?.arguments?.rehab === 50000,
    "Explicit ARV and rehab calculate the exact user-supplied heuristic",
    explicitInputs,
  );

  const dscr = await complete("Would a DSCR loan work for this rental?");
  assert(
    /need/i.test(dscr.content) &&
      !/1\.2[05]x|20-25%|20%|25%/.test(dscr.content),
    "DSCR fallback requires inputs instead of hardcoding lender thresholds",
    dscr,
  );

  const liquidity = await complete("I have $60,000 cash available. How much should I use?");
  assert(
    liquidity.content.includes("60,000") &&
      /will not assume/i.test(liquidity.content) &&
      !liquidity.content.includes("20,000") &&
      !liquidity.content.includes("$20k"),
    "Liquidity guidance does not prescribe a canned reserve amount",
    liquidity,
  );

  const delano = await complete("What do you think about investing in Delano?");
  assert(
    !delano.toolCalls?.length &&
      /will not claim current rent, resale demand, comps, or returns/i.test(delano.content) &&
      !/strong rental yield|strong demand|top pricing/i.test(delano.content),
    "Neighborhood fallback avoids unsupported current return or demand claims",
    delano,
  );

  const seller = await complete("My mother passed away and I inherited her Wichita house. I may need to sell it.");
  assert(
    seller.toolCalls?.[0]?.name === "activate_seller_intake" &&
      /preliminary/i.test(seller.content) &&
      /verified/i.test(seller.content),
    "Inherited-property flow routes to seller intake with verification caveats",
    seller,
  );

  console.log("==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((error) => {
  console.error("G fallback regression failed:", error);
  process.exit(1);
});
