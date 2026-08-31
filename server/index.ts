import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GIntelligenceGateway } from "./services/gIntelligenceGateway.js";
import { HunterAdapter, VictorAdapter } from "./services/systemAdapters.js";
import { PiperQueueAdapter, SellerActionType } from "./services/piperAdapter.js";
import { WichitaPropertyService } from "./services/wichitaPropertyService.js";
import { SellerUnderwritingService } from "./services/sellerUnderwritingService.js";
import { OcgObservability } from "./services/observability.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedSellerActions: SellerActionType[] = [
  "ACCEPT_PRELIMINARY_OFFER",
  "COUNTEROFFER",
  "REQUEST_CALL",
  "REQUEST_WALKTHROUGH",
];

function internalEndpointsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.OCGICT_ENABLE_INTERNAL_ENDPOINTS === "true";
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.post("/api/g/chat", async (req, res) => {
    try {
      const response = await GIntelligenceGateway.processMessage(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "G Intelligence Gateway processing error" });
    }
  });

  app.get("/api/property/lookup", async (req, res) => {
    try {
      const address = (req.query.address as string) || "";
      if (!address) return res.status(400).json({ error: "Missing required query parameter: address" });
      const record = await WichitaPropertyService.lookupPublicRecord({ address });
      res.json({ record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/seller/property-lookup", async (req, res) => {
    try {
      const address = String(req.body?.address || "").trim();
      if (!address) return res.status(400).json({ error: "Missing address" });
      const publicRecord = await WichitaPropertyService.lookupPublicRecord({ address });
      res.json({ address, publicRecord, found: !!publicRecord });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/seller/preliminary-offer", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload?.address) return res.status(400).json({ error: "Missing required seller intake payload: address" });
      if (!payload?.fullName || !payload?.email || !payload?.phone) return res.status(400).json({ error: "Name, email, and phone are required" });
      const offerResult = await SellerUnderwritingService.processSellerIntake(payload);
      res.json(offerResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/seller/action", async (req, res) => {
    try {
      const offerId = String(req.body?.offerId || "").trim();
      const action = req.body?.action as SellerActionType;
      if (!offerId) return res.status(400).json({ error: "Missing offerId" });
      if (!allowedSellerActions.includes(action)) return res.status(400).json({ error: "Invalid seller action" });

      const counterAmount = req.body?.counterAmount == null ? undefined : Number(req.body.counterAmount);
      if (action === "COUNTEROFFER" && (!Number.isFinite(counterAmount) || Number(counterAmount) <= 0)) {
        return res.status(400).json({ error: "A valid counteroffer amount is required" });
      }

      const record = await PiperQueueAdapter.recordSellerAction({
        offerId,
        action,
        counterAmount,
        preferredWindow: req.body?.preferredWindow ? String(req.body.preferredWindow) : undefined,
        notes: req.body?.notes ? String(req.body.notes).slice(0, 1000) : undefined,
      });
      res.status(201).json({
        ok: true,
        record,
        message: action === "ACCEPT_PRELIMINARY_OFFER"
          ? "Your preliminary acceptance was recorded. It remains subject to walkthrough, verification, title review, and a separate written purchase agreement."
          : "Your request was recorded for OCG review.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  if (internalEndpointsEnabled()) {
    app.post("/api/property/victor-payload", async (req, res) => {
      try {
        const { publicRecord } = req.body;
        if (!publicRecord) return res.status(400).json({ error: "Missing required body: publicRecord" });
        res.json({ victorRecord: WichitaPropertyService.toPropertyIntelligenceRecord(publicRecord) });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post("/api/adapters/hunter", async (req, res) => {
      try { res.json(await HunterAdapter.querySignals(req.body)); }
      catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.post("/api/adapters/victor", async (req, res) => {
      try { res.json(await VictorAdapter.underwriteDeal(req.body)); }
      catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.post("/api/adapters/piper", async (req, res) => {
      try { res.json(await PiperQueueAdapter.enqueueStrategyBrief(req.body)); }
      catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.get("/api/adapters/piper/outbox", (_req, res) => res.json({ outbox: PiperQueueAdapter.getPendingOutbox() }));
    app.get("/api/operations/work-items", (_req, res) => res.json({ workItems: PiperQueueAdapter.getWorkItems() }));
    app.get("/api/telemetry/events", (_req, res) => res.json({ events: OcgObservability.getRecentEvents() }));
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "OCG Production Intelligence Gateway",
      version: "5.1.0",
      dataMode: process.env.OCGICT_DATA_MODE || "production",
      canonicalRepo: "TheOCGroup/OCGICT.com",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  const staticPath = process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));

  return app;
}

const app = createApp();

export default app;

if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  const server = createServer(app);
  server.listen(port, () => {
    console.log(`[OCG SERVER] Production Gateway running on http://localhost:${port}/`);
    OcgObservability.log("G_SESSION_STARTED", { serverPort: port, status: "online" });
  });
}
