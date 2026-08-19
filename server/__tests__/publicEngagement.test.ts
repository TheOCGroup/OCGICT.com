import assert from "node:assert/strict";
import { PublicEngagementService } from "../services/publicEngagementService";
import { PiperQueueAdapter } from "../services/piperAdapter";

async function run() {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;

  const before = PiperQueueAdapter.getWorkItems().length;

  const contact = await PublicEngagementService.submitContact({
    audience: "seller",
    name: "Test Seller",
    email: "seller@example.com",
    phone: "316-555-0100",
    propertyAddress: "123 Test St, Wichita, KS",
    timeline: "30 days",
    message: "Inherited property; needs repairs.",
    source: "regression-test",
  });

  assert.equal(contact.status, "CAPTURED_STAGING_ONLY");
  assert.equal(contact.persistence, "NOT_CONFIGURED");
  assert.ok(contact.trackingId.startsWith("OUTBOX_LEAD_"));
  assert.equal(PiperQueueAdapter.getWorkItems().length, before + 1);
  const newest = PiperQueueAdapter.getWorkItems()[0];
  assert.equal(newest.category, "SELLER_ACQUISITION");
  assert.equal(newest.propertyAddress, "123 Test St, Wichita, KS");

  await assert.rejects(
    () => PublicEngagementService.submitContact({ audience: "investor", name: "Bad Email", email: "not-an-email" }),
    /valid email/i,
  );

  const newsletter = await PublicEngagementService.subscribeNewsletter({
    email: "reader@example.com",
    source: "regression-test",
  });

  assert.equal(newsletter.status, "CAPTURED_STAGING_ONLY");
  assert.equal(newsletter.persistence, "NOT_CONFIGURED");
  assert.match(newsletter.message, /not configured/i);

  await assert.rejects(
    () => PublicEngagementService.subscribeNewsletter({ email: "bad" }),
    /valid email/i,
  );

  console.log("Public engagement regression suite passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
