import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { createServer } from "../server/index.js";
import {
  extractHttpKey,
  getBaseUrl,
  getFeatures,
  getReadOnly,
  MissingApiKeyError,
} from "../config.js";

/**
 * SSE transport — DEPRECATED (kept to mirror the reference server). One process
 * serves many users, so the per-user key is read from the request header at
 * `GET /sse` and bound to that session (never a shared/process-wide key).
 */
console.error("[lyzr-mcp] starting (deprecated) SSE server...");

const app = express();
app.use(cors({ origin: "*", exposedHeaders: ["mcp-session-id"] }));

const transports: Map<string, SSEServerTransport> = new Map();

app.get("/sse", async (req: Request, res: Response) => {
  let apiKey: string;
  try {
    apiKey = extractHttpKey(req.headers);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      res.status(401).send(error.message);
      return;
    }
    throw error;
  }

  const { server, cleanup } = createServer(apiKey, getBaseUrl(), {
    features: getFeatures(),
    readOnly: getReadOnly(),
  });
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);

  res.on("close", () => {
    transports.delete(transport.sessionId);
    cleanup(transport.sessionId);
  });

  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    res.status(400).send("No transport found for sessionId");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`[lyzr-mcp] (deprecated) SSE server listening on port ${PORT}`);
});
