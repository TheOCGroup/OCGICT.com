import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GIntelligenceGateway } from "./services/gIntelligenceGateway";
import { HunterAdapter, VictorAdapter, PiperAdapter } from "./services/systemAdapters";
import { OcgObservability } from "./services/observability";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // ── OCG Production Intelligence & Gateway APIs ──────────────────
  app.post("/api/g/chat", async (req, res) => {
    try {
      const response = await GIntelligenceGateway.processMessage(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "G Intelligence Gateway processing error" });
    }
  });

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
      const response = await PiperAdapter.ingestStrategyBrief(req.body);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/telemetry/events", (_req, res) => {
    res.json({ events: OcgObservability.getRecentEvents() });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "OCG Production Intelligence Gateway",
      version: "3.0.0",
      canonicalRepo: "TheOCGroup/ocg-website",
      timestamp: new Date().toISOString(),
    });
  });

  // ── Static Assets & Client-Side Routing ─────────────────────────
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
    console.log(`[OCG SERVER] Gateway running on http://localhost:${port}/`);
    OcgObservability.log("G_SESSION_STARTED", { serverPort: port, status: "online" });
  });
}

startServer().catch(console.error);
