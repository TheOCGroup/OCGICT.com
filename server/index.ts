import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GIntelligenceGateway } from "./services/gIntelligenceGateway";
import { getActiveStreamingModelProvider } from "./services/streamingModelProvider";
import { HunterAdapter, VictorAdapter } from "./services/systemAdapters";
import { PiperQueueAdapter } from "./services/piperAdapter";
import { WichitaPropertyService } from "./services/wichitaPropertyService";
import { OcgObservability } from "./services/observability";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Security Headers & CORS
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // ── 1. G Intelligence Gateway Endpoints ─────────────────────────
  app.post("/api/g/chat", async (req, res) => {
    try {
      const response = await GIntelligenceGateway.processMessage(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "G Intelligence Gateway processing error" });
    }
  });

  // Streaming SSE Endpoint for G Dialogue
  app.post("/api/g/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const provider = getActiveStreamingModelProvider();
      const messages = [
        { role: "system" as const, content: "You are G — OCG Investment Intelligence." },
        { role: "user" as const, content: req.body.message || "" },
      ];

      const stream = await provider.generateStream({ messages });
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
      res.end();
    }
  });

  // ── 2. Wichita Public Property Intelligence Endpoints ───────────
  app.get("/api/property/lookup", async (req, res) => {
    try {
      const address = (req.query.address as string) || "";
      if (!address) {
        return res.status(400).json({ error: "Missing required query parameter: address" });
      }
      const record = await WichitaPropertyService.lookupPublicRecord({ address });
      res.json({ record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/property/victor-payload", async (req, res) => {
    try {
      const { publicRecord } = req.body;
      if (!publicRecord) {
        return res.status(400).json({ error: "Missing required body: publicRecord" });
      }
      const victorRecord = WichitaPropertyService.toPropertyIntelligenceRecord(publicRecord);
      res.json({ victorRecord });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── 3. HUNTER / VICTOR / PIPER Adapter Endpoints ────────────────
  app.post("/api/adapters/hunter", async (req, res) => {
    try {
      const response = await HunterAdapter.querySignals(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/adapters/victor", async (req, res) => {
    try {
      const response = await VictorAdapter.underwriteDeal(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/adapters/piper", async (req, res) => {
    try {
      const response = await PiperQueueAdapter.enqueueStrategyBrief(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/adapters/piper/outbox", (_req, res) => {
    res.json({ outbox: PiperQueueAdapter.getPendingOutbox() });
  });

  // ── 4. Observability & Health ───────────────────────────────────
  app.get("/api/telemetry/events", (_req, res) => {
    res.json({ events: OcgObservability.getRecentEvents() });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "OCG Production Intelligence Gateway",
      version: "5.0.0",
      canonicalRepo: "TheOCGroup/OCGICT.com",
      timestamp: new Date().toISOString(),
    });
  });

  // ── 5. Static Assets & Client-Side Routing ──────────────────────
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`[OCG SERVER] Production Gateway running on http://localhost:${port}/`);
    OcgObservability.log("G_SESSION_STARTED", { serverPort: port, status: "online" });
  });
}

startServer().catch(console.error);
