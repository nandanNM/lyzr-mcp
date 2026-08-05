import {
  StreamableHTTPServerTransport,
  type EventStore,
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { createLyzrMcpServer } from "../server/index.js";
import {
  extractHttpKey,
  getBaseUrl,
  getFeatures,
  getReadOnly,
  MissingApiKeyError,
} from "../config.js";

/**
 * Streamable HTTP transport — mirrors the reference server, plus per-user auth.
 *
 * One process, many users: the caller's key is read from the `x-api-key` /
 * `Authorization: Bearer` header at session initialization and bound to that
 * session's server instance. No cross-session key sharing; missing key -> 401.
 */

/** In-memory event store for SSE resumability (replay after Last-Event-ID). */
class InMemoryEventStore implements EventStore {
  private events: Map<string, { streamId: string; message: unknown }> =
    new Map();

  async storeEvent(streamId: string, message: unknown): Promise<string> {
    const eventId = randomUUID();
    this.events.set(eventId, { streamId, message });
    return eventId;
  }

  async replayEventsAfter(
    lastEventId: string,
    { send }: { send: (eventId: string, message: unknown) => Promise<void> },
  ): Promise<string> {
    const entries = Array.from(this.events.entries());
    const startIndex = entries.findIndex(([id]) => id === lastEventId);
    if (startIndex === -1) return lastEventId;

    let lastId = lastEventId;
    for (let i = startIndex + 1; i < entries.length; i++) {
      const [eventId, { message }] = entries[i];
      await send(eventId, message);
      lastId = eventId;
    }
    return lastId;
  }
}

console.error("[lyzr-mcp] starting Streamable HTTP server...");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,DELETE",
    exposedHeaders: ["mcp-session-id", "last-event-id", "mcp-protocol-version"],
  }),
);

const transports: Map<string, StreamableHTTPServerTransport> = new Map();

const jsonError = (
  res: Response,
  status: number,
  code: number,
  message: string,
  id?: unknown,
) => res.status(status).json({ jsonrpc: "2.0", error: { code, message }, id });

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      transport = transports.get(sessionId)!;
    } else if (!sessionId) {
      // New session — authenticate with the caller's own key.
      let apiKey: string;
      try {
        apiKey = extractHttpKey(req.headers);
      } catch (error) {
        if (error instanceof MissingApiKeyError) {
          jsonError(
            res,
            401,
            -32001,
            "Unauthorized: provide your Lyzr API key via x-api-key or Authorization: Bearer.",
            req?.body?.id,
          );
          return;
        }
        throw error;
      }

      const { server, cleanup } = createLyzrMcpServer(apiKey, getBaseUrl(), {
        features: getFeatures(),
        readOnly: getReadOnly(),
      });
      const eventStore = new InMemoryEventStore();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore,
        onsessioninitialized: (sid: string) => {
          transports.set(sid, transport);
        },
      });

      server.server.onclose = async () => {
        const sid = transport.sessionId;
        if (sid && transports.has(sid)) {
          transports.delete(sid);
          cleanup(sid);
        }
      };

      await server.connect(transport);
      await transport.handleRequest(req, res);
      return;
    } else {
      jsonError(
        res,
        400,
        -32000,
        "Bad Request: No valid session ID provided",
        req?.body?.id,
      );
      return;
    }

    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("[lyzr-mcp] error handling MCP request:", error);
    if (!res.headersSent) {
      jsonError(res, 500, -32603, "Internal server error", req?.body?.id);
    }
  }
});

// GET /mcp — open the server->client SSE stream for an existing session.
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    jsonError(
      res,
      400,
      -32000,
      "Bad Request: No valid session ID provided",
      req?.body?.id,
    );
    return;
  }
  await transport.handleRequest(req, res);
});

// DELETE /mcp — terminate a session.
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    jsonError(
      res,
      400,
      -32000,
      "Bad Request: No valid session ID provided",
      req?.body?.id,
    );
    return;
  }
  await transport.handleRequest(req, res);
});

const PORT = process.env.PORT || 3001;
const httpServer = app.listen(PORT, () => {
  console.error(`[lyzr-mcp] Streamable HTTP server listening on port ${PORT}`);
});

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[lyzr-mcp] Failed to start: port ${PORT} is in use. Set PORT to a free port.`,
    );
  } else {
    console.error("[lyzr-mcp] HTTP server error:", err);
  }
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.error("[lyzr-mcp] shutting down...");
  // for...of over the Map (NOT for...in) — see explanation doc §6.
  for (const sessionId of transports.keys()) {
    try {
      await transports.get(sessionId)!.close();
      transports.delete(sessionId);
    } catch (error) {
      console.error(`[lyzr-mcp] error closing session ${sessionId}:`, error);
    }
  }
  process.exit(0);
});
