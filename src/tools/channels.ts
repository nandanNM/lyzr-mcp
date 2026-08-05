import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChannelsClient } from "../lyzr/channels.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const agentRouteSchema = z.object({
  agent_id: z.string().describe("The agent id for this route"),
  name: z.string().describe("Display name for this route"),
});

/** Register the Channels tools. */
export const registerChannelsTools = (
  server: McpServer,
  client: ChannelsClient,
) => {
  server.registerTool(
    "lyzr_channel_webhook",
    {
      title: "Channel Webhook",
      description:
        "Deliver an inbound messaging-platform webhook payload to a channel for processing.",
      inputSchema: {
        channel_id: z.string().describe("The channel id"),
        payload: z
          .record(z.string(), z.unknown())
          .describe("The raw webhook payload from the messaging platform"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ channel_id, payload }, extra) =>
      txt(await client.channelWebhook(channel_id, payload, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_channel",
    {
      title: "Create Channel",
      description:
        "Create a channel configuration that routes an inbound messaging platform (e.g. telegram, slack) to Lyzr agents.",
      inputSchema: {
        platform: z
          .string()
          .describe(
            "Platform key matching a registered adapter, e.g. telegram, slack",
          ),
        default_agent_id: z
          .string()
          .describe("Agent used when the user has not explicitly switched"),
        agent_routes: z
          .array(agentRouteSchema)
          .optional()
          .describe(
            "Agents accessible through this bot. If omitted, a single 'default' route is auto-created from default_agent_id",
          ),
        config: z
          .record(z.string(), z.unknown())
          .describe(
            "Platform-specific config dict (fields validated by the platform's adapter)",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createChannel(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_channels",
    {
      title: "List Channels",
      description: "List channel configurations for a given agent.",
      inputSchema: {
        agent_id: z.string().describe("Agent id whose channels to list"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.listChannels(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_all_channels",
    {
      title: "List All Channels",
      description: "List every channel configuration.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listAllChannels(extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_channel",
    {
      title: "Delete Channel",
      description: "Permanently delete a channel configuration by id.",
      inputSchema: {
        channel_id: z.string().describe("The channel id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ channel_id }, extra) => {
      const result = await client.deleteChannel(channel_id, extra.signal);
      return txt(`Deleted channel \`${channel_id}\`.\n\n${JSON.stringify(result, null, 2)}`);
    },
  );

  server.registerTool(
    "lyzr_add_channel_agent_route",
    {
      title: "Add Channel Agent Route",
      description: "Add a new agent route to an existing channel.",
      inputSchema: {
        channel_id: z.string().describe("The channel id"),
        agent_id: z.string().describe("Agent id for the new route"),
        name: z.string().describe("Display name for the new route"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ channel_id, agent_id, name }, extra) =>
      txt(
        await client.addAgentRoute(
          channel_id,
          { agent_id, name },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_remove_channel_agent_route",
    {
      title: "Remove Channel Agent Route",
      description: "Remove an agent route from a channel.",
      inputSchema: {
        channel_id: z.string().describe("The channel id"),
        agent_id: z.string().describe("The agent id whose route to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ channel_id, agent_id }, extra) =>
      txt(await client.removeAgentRoute(channel_id, agent_id, extra.signal)),
  );
};
