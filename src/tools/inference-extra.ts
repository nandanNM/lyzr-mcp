import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { InferenceExtraClient } from "../lyzr/inference-extra.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const passthroughObj = z
  .record(z.string(), z.unknown())
  .describe("Arbitrary key/value object");

/** Register the Inference-extra tools (tools/execute, chat tasks, voice, files, v4/OpenAI-compatible). */
export const registerInferenceExtraTools = (
  server: McpServer,
  client: InferenceExtraClient,
) => {
  server.registerTool(
    "lyzr_execute_tool",
    {
      title: "Execute Tool",
      description:
        "Execute a named tool (with optional tool configs) directly, without a full chat turn.",
      inputSchema: {
        tool_name: z.string().describe("The tool's name to execute"),
        agent_id: z
          .string()
          .optional()
          .describe("Optional agent id context for the tool call"),
        tool_configs: z
          .array(passthroughObj)
          .optional()
          .describe("Tool configuration objects"),
        arguments: passthroughObj
          .optional()
          .describe("Arguments to pass to the tool"),
        trace_id: z.string().optional().describe("Optional trace id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.executeTool(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_submit_chat_task",
    {
      title: "Submit Chat Task",
      description:
        "Submit a chat message to an agent as an async task; returns a task_id to poll.",
      inputSchema: {
        agent_id: z.string().describe("The agent id"),
        session_id: z.string().describe("The session id"),
        message: z.string().optional().describe("The chat message"),
        user_id: z
          .string()
          .optional()
          .describe("User id (default default_user)"),
        messages: z
          .array(passthroughObj)
          .optional()
          .describe("Alternative to message: a list of chat messages"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.submitChatTask(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_chat_task_status",
    {
      title: "Get Chat Task Status",
      description:
        "Poll the status/result of a chat task submitted via lyzr_submit_chat_task.",
      inputSchema: {
        task_id: z.string().describe("The chat task id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ task_id }, extra) =>
      txt(await client.getChatTaskStatus(task_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_webrtc_session",
    {
      title: "Create WebRTC Voice Session",
      description: "Create a WebRTC voice session for an agent + voice id.",
      inputSchema: {
        agent_id: z.string().describe("The agent id"),
        voice_id: z
          .string()
          .describe("The voice id (e.g. an ElevenLabs voice)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, voice_id }, extra) =>
      txt(await client.createWebrtcSession(agent_id, voice_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_chat_with_file",
    {
      title: "Chat With File",
      description:
        "Send a chat message to an agent with an attached file (base64-encoded content).",
      inputSchema: {
        agent_id: z.string().describe("The agent id"),
        session_id: z.string().describe("The session id"),
        message: z.string().describe("The chat message"),
        user_id: z
          .string()
          .optional()
          .describe("User id (default default_user)"),
        system_prompt_variables: z
          .string()
          .optional()
          .describe("JSON-encoded system prompt variables (default '{}')"),
        filter_variables: z
          .string()
          .optional()
          .describe("JSON-encoded filter variables (default '{}')"),
        features: z
          .string()
          .optional()
          .describe("JSON-encoded features override"),
        file: z
          .string()
          .optional()
          .describe("Base64-encoded file content to attach"),
        file_name: z
          .string()
          .optional()
          .describe("Filename for the attached file"),
        file_content_type: z
          .string()
          .optional()
          .describe("MIME type of the attached file"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.chatWithFile(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_stop_session",
    {
      title: "Stop Session",
      description: "Stop an active inference session.",
      inputSchema: {
        session_id: z.string().describe("The session id to stop"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.stopSession(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_start_session",
    {
      title: "Start Session",
      description: "Start (or resume) an inference session.",
      inputSchema: {
        session_id: z.string().describe("The session id to start"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.startSession(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_voices",
    {
      title: "List Voices",
      description: "List the available ElevenLabs voices configuration.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listVoices(extra.signal)),
  );

  server.registerTool(
    "lyzr_agent_chat_completions",
    {
      title: "Agent Chat Completions",
      description:
        "OpenAI-compatible chat/completions endpoint scoped to a specific agent.",
      inputSchema: {
        agent_id: z.string().describe("The agent id"),
        messages: z
          .array(passthroughObj)
          .min(1)
          .describe("OpenAI-style chat messages"),
        stream: z
          .boolean()
          .optional()
          .describe("Whether to stream the response (default false)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...body }, extra) =>
      txt(await client.agentChatCompletions(agent_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_simple_chat_completions",
    {
      title: "Simple Chat Completions",
      description:
        "OpenAI-compatible chat/completions endpoint that selects the model/provider directly, without a pre-created agent.",
      inputSchema: {
        model: z.string().describe("The model name"),
        messages: z
          .array(passthroughObj)
          .min(1)
          .describe("OpenAI-style chat messages"),
        temperature: z
          .number()
          .optional()
          .describe("Sampling temperature (default 0.7)"),
        top_p: z.number().optional().describe("Top-p (default 1.0)"),
        credential_id: z
          .string()
          .optional()
          .describe("LLM credential id to use"),
        session_id: z.string().optional().describe("Optional session id"),
        provider_id: z.string().optional().describe("Optional provider id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.simpleChatCompletions(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_inference_v4",
    {
      title: "Create Inference (v4)",
      description:
        "Create a v4 inference response (OpenAI Responses-API style: model + input + tools).",
      inputSchema: {
        model: z.string().describe("The model name"),
        input: z
          .union([z.string(), z.array(passthroughObj)])
          .describe("A plain text prompt, or a list of structured input items"),
        instructions: z.string().optional().describe("System instructions"),
        stream: z
          .boolean()
          .optional()
          .describe("Whether to stream (default false)"),
        temperature: z.number().optional().describe("Sampling temperature"),
        top_p: z.number().optional().describe("Top-p"),
        max_output_tokens: z
          .number()
          .int()
          .optional()
          .describe("Max output tokens"),
        tools: z.array(passthroughObj).optional().describe("Tool definitions"),
        tool_choice: z
          .union([z.string(), passthroughObj])
          .optional()
          .describe("Tool choice strategy"),
        text: passthroughObj.optional().describe("Text output format options"),
        previous_response_id: z
          .string()
          .optional()
          .describe("Previous response id to continue from"),
        store: z
          .boolean()
          .optional()
          .describe("Whether to store the response (default true)"),
        user: z.string().optional().describe("End-user identifier"),
        reasoning: passthroughObj.optional().describe("Reasoning options"),
        truncation: z.string().optional().describe("Truncation strategy"),
        include: z
          .array(z.string())
          .optional()
          .describe("Additional fields to include in the response"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createInference(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_chat_completions_v4",
    {
      title: "Chat Completions (v4)",
      description:
        "OpenAI-compatible v4 chat/completions endpoint (model + messages).",
      inputSchema: {
        model: z.string().describe("The model name"),
        messages: z
          .array(passthroughObj)
          .min(1)
          .describe("OpenAI-style chat messages"),
        temperature: z.number().optional().describe("Sampling temperature"),
        top_p: z.number().optional().describe("Top-p"),
        n: z
          .number()
          .int()
          .optional()
          .describe("Number of completions (default 1)"),
        stream: z
          .boolean()
          .optional()
          .describe("Whether to stream (default false)"),
        stream_options: passthroughObj.optional().describe("Streaming options"),
        stop: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe("Stop sequence(s)"),
        max_tokens: z.number().int().optional().describe("Max tokens (legacy)"),
        max_completion_tokens: z
          .number()
          .int()
          .optional()
          .describe("Max completion tokens"),
        presence_penalty: z.number().optional().describe("Presence penalty"),
        frequency_penalty: z.number().optional().describe("Frequency penalty"),
        tools: z.array(passthroughObj).optional().describe("Tool definitions"),
        tool_choice: z
          .union([z.string(), passthroughObj])
          .optional()
          .describe("Tool choice strategy"),
        response_format: passthroughObj
          .optional()
          .describe("Response format spec"),
        seed: z.number().int().optional().describe("Sampling seed"),
        user: z.string().optional().describe("End-user identifier"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.chatCompletionsV4(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_response_v4",
    {
      title: "Create Response (v4)",
      description:
        "OpenAI-compatible v4 responses endpoint (model + input + tools).",
      inputSchema: {
        model: z.string().describe("The model name"),
        input: z
          .union([z.string(), z.array(passthroughObj)])
          .describe("A plain text prompt, or a list of structured input items"),
        instructions: z.string().optional().describe("System instructions"),
        stream: z
          .boolean()
          .optional()
          .describe("Whether to stream (default false)"),
        temperature: z.number().optional().describe("Sampling temperature"),
        top_p: z.number().optional().describe("Top-p"),
        max_output_tokens: z
          .number()
          .int()
          .optional()
          .describe("Max output tokens"),
        tools: z.array(passthroughObj).optional().describe("Tool definitions"),
        tool_choice: z
          .union([z.string(), passthroughObj])
          .optional()
          .describe("Tool choice strategy"),
        text: passthroughObj.optional().describe("Text output format options"),
        previous_response_id: z
          .string()
          .optional()
          .describe("Previous response id to continue from"),
        store: z
          .boolean()
          .optional()
          .describe("Whether to store the response (default true)"),
        user: z.string().optional().describe("End-user identifier"),
        reasoning: passthroughObj.optional().describe("Reasoning options"),
        truncation: z.string().optional().describe("Truncation strategy"),
        include: z
          .array(z.string())
          .optional()
          .describe("Additional fields to include in the response"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createResponseV4(args, extra.signal)),
  );
};
