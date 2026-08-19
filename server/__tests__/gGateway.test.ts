import assert from "node:assert/strict";
import { GIntelligenceGateway } from "../services/gIntelligenceGateway";

async function run() {
  const investor = await GIntelligenceGateway.processMessage({
    sessionId: "test-investor-60k",
    message: "I have $60k available and I am considering my first flip in Wichita.",
    clientContext: { route: "/invest", section: "strategy" },
  });

  assert.equal(investor.strategyBrief?.clientContext.availableLiquidityTier.value, "$50k-$100k");
  assert.equal(investor.strategyBrief?.clientContext.investorStage.value, "Beginner");
  assert.equal(investor.strategyBrief?.strategyExploration.primaryFit.value, "Fix & Flip");
  assert.equal(investor.strategyBrief?.strategyExploration.modeledUnderwritingContext, undefined);
  assert.match(investor.strategyBrief?.executiveIntelligence.gConversationSummary || "", /not a recommendation/i);

  const noCapital = await GIntelligenceGateway.processMessage({
    sessionId: "test-investor-no-capital",
    message: "I am interested in BRRRR but have not decided how much capital I want to deploy.",
  });
  assert.equal(noCapital.strategyBrief, undefined, "G must not invent a liquidity tier when none was stated");

  const seller = await GIntelligenceGateway.processMessage({
    sessionId: "test-seller",
    message: "My family inherited a house in Wichita and we may need to sell it.",
    clientContext: { route: "/sell" },
  });
  assert.equal(seller.strategyBrief, undefined, "Seller intent belongs in seller intake, not an invented investor brief");

  const mixed = await GIntelligenceGateway.processMessage({
    sessionId: "test-mixed",
    message: "I have $120,000 and I am not sure whether to flip or build a rental portfolio.",
  });
  assert.equal(mixed.strategyBrief?.clientContext.availableLiquidityTier.value, "$100k-$250k");
  assert.equal(mixed.strategyBrief?.strategyExploration.primaryFit.value, "Fix & Flip");

  console.log("G gateway regression suite passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
