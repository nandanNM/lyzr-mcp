import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArtifactsClient } from "../lyzr/artifacts.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Artifacts tools. */
export const registerArtifactsTools = (
  server: McpServer,
  client: ArtifactsClient,
) => {
  server.registerTool(
    "lyzr_create_artifact",
    {
      title: "Create Artifact",
      description: "Create a new artifact for a user/session. Returns the created artifact.",
      inputSchema: {
        user_id: z.string().describe("User id that owns the artifact"),
        session_id: z.string().describe("Session id the artifact belongs to"),
        data: z.unknown().describe("The artifact payload/content"),
        format_type: z
          .string()
          .optional()
          .describe("Format of the data, e.g. text, json, markdown (default text)"),
        name: z.string().optional().describe("Artifact name"),
        description: z.string().optional().describe("Artifact description"),
        metadata: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Arbitrary metadata to attach"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createArtifact(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_artifacts",
    {
      title: "List Artifacts",
      description: "List artifacts with optional pagination and filters.",
      inputSchema: {
        page: z.number().int().min(1).optional().describe("Page number (default 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Items per page (default 10, max 100)"),
        user_id: z.string().optional().describe("Filter by user id"),
        session_id: z.string().optional().describe("Filter by session id"),
        format_type: z.string().optional().describe("Filter by format type"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.listArtifacts(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_artifact",
    {
      title: "Get Artifact",
      description: "Fetch a single artifact by id, scoped to a user and session.",
      inputSchema: {
        artifact_id: z.string().describe("Artifact id"),
        user_id: z.string().describe("User id"),
        session_id: z.string().describe("Session id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ artifact_id, user_id, session_id }, extra) =>
      txt(await client.getArtifact(artifact_id, user_id, session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_artifact",
    {
      title: "Update Artifact",
      description: "Update fields on an existing artifact, scoped to a user and session.",
      inputSchema: {
        artifact_id: z.string().describe("Artifact id to update"),
        user_id: z.string().describe("User id"),
        session_id: z.string().describe("Session id"),
        data: z.unknown().optional().describe("New artifact payload/content"),
        format_type: z.string().optional().describe("New format type"),
        name: z.string().optional().describe("New name"),
        description: z.string().optional().describe("New description"),
        metadata: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("New metadata (replaces existing)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ artifact_id, user_id, session_id, ...updates }, extra) =>
      txt(
        await client.updateArtifact(
          artifact_id,
          user_id,
          session_id,
          updates,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_delete_artifact",
    {
      title: "Delete Artifact",
      description: "Permanently delete an artifact by id, scoped to a user and session.",
      inputSchema: {
        artifact_id: z.string().describe("Artifact id to delete"),
        user_id: z.string().describe("User id"),
        session_id: z.string().describe("Session id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ artifact_id, user_id, session_id }, extra) =>
      txt(await client.deleteArtifact(artifact_id, user_id, session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_artifacts_by_session",
    {
      title: "List Artifacts by User Session",
      description: "List paginated artifacts belonging to a specific user's session.",
      inputSchema: {
        user_id: z.string().describe("User id"),
        session_id: z.string().describe("Session id"),
        page: z.number().int().min(1).optional().describe("Page number (default 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Items per page (default 10, max 100)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ user_id, session_id, page, limit }, extra) =>
      txt(
        await client.listArtifactsByUserSession(
          user_id,
          session_id,
          page,
          limit,
          extra.signal,
        ),
      ),
  );
};
