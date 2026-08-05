import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AgentMemoryProvidersClient } from "../lyzr/agent-memory-providers.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Agent Memory Providers tools (aws-agentcore/mem0/supermemory config). */
export const registerAgentMemoryProvidersTools = (
  server: McpServer,
  client: AgentMemoryProvidersClient,
) => {
  server.registerTool(
    "lyzr_memprovider_list_providers",
    {
      title: "List Memory Providers",
      description: "List the memory providers available for agents.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listProviders(extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_get_provider",
    {
      title: "Get Memory Provider",
      description: "Fetch a single memory provider by id.",
      inputSchema: {
        provider_id: z.string().describe("The memory provider id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id }, extra) =>
      txt(await client.getProvider(provider_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_validate_aws_agentcore",
    {
      title: "Validate AWS AgentCore Credentials",
      description:
        "Validate AWS AgentCore credentials and list associated memories.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("The AWS AgentCore credential id to validate"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.validateAwsAgentcore(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_aws_agentcore_status",
    {
      title: "Get AWS AgentCore Provisioning Status",
      description:
        "Get the provisioning status of an AWS AgentCore memory resource.",
      inputSchema: {
        credential_id: z.string().describe("The AWS AgentCore credential id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.getAwsAgentcoreStatus(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_list_aws_agentcore_resources",
    {
      title: "List AWS AgentCore Memory Resources",
      description: "List the AWS AgentCore memory resources for a credential.",
      inputSchema: {
        credential_id: z.string().describe("The AWS AgentCore credential id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.listAwsAgentcoreResources(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_use_existing_aws_agentcore_memory",
    {
      title: "Use Existing AWS AgentCore Memory",
      description:
        "Attach an existing AWS AgentCore memory resource to a credential.",
      inputSchema: {
        credential_id: z.string().describe("The AWS AgentCore credential id"),
        memory_id: z
          .string()
          .describe("The id of the existing AWS AgentCore memory resource"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ credential_id, memory_id }, extra) =>
      txt(
        await client.useExistingAwsAgentcoreMemory(
          credential_id,
          { memory_id },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_memprovider_provision_aws_agentcore_memory",
    {
      title: "Provision AWS AgentCore Memory",
      description: "Provision a new AWS AgentCore memory resource.",
      inputSchema: {
        credential_id: z.string().describe("The AWS AgentCore credential id"),
        memory_name: z.string().describe("Name for the new memory resource"),
        event_expiry_days: z
          .number()
          .int()
          .optional()
          .describe("Days before memory events expire (default 30)"),
        memory_strategy: z
          .string()
          .nullable()
          .optional()
          .describe("Optional memory strategy identifier"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (
      { credential_id, memory_name, event_expiry_days, memory_strategy },
      extra,
    ) =>
      txt(
        await client.provisionAwsAgentcoreMemory(
          credential_id,
          { memory_name, event_expiry_days, memory_strategy },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_memprovider_delete_aws_agentcore_resource",
    {
      title: "Delete AWS AgentCore Memory Resource",
      description:
        "Permanently delete the AWS AgentCore memory resource for a credential.",
      inputSchema: {
        credential_id: z.string().describe("The AWS AgentCore credential id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.deleteAwsAgentcoreResource(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_validate_mem0",
    {
      title: "Validate Mem0 Credentials",
      description: "Validate Mem0 memory provider credentials.",
      inputSchema: {
        credential_id: z.string().describe("The Mem0 credential id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.validateMem0(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_mem0_status",
    {
      title: "Get Mem0 Status",
      description: "Get the status of a Mem0 memory provider credential.",
      inputSchema: {
        credential_id: z.string().describe("The Mem0 credential id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.getMem0Status(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_validate_supermemory",
    {
      title: "Validate Supermemory Credentials",
      description: "Validate Supermemory memory provider credentials.",
      inputSchema: {
        credential_id: z.string().describe("The Supermemory credential id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.validateSupermemory(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memprovider_supermemory_status",
    {
      title: "Get Supermemory Status",
      description:
        "Get the status of a Supermemory memory provider credential.",
      inputSchema: {
        credential_id: z.string().describe("The Supermemory credential id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.getSupermemoryStatus(credential_id, extra.signal)),
  );
};
