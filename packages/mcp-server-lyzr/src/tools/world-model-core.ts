import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { WorldModelCoreClient } from "../lyzr/world-model-core.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const personaSchema = {
  name: z.string().describe("Persona name"),
  description: z.string().describe("Persona description"),
};

const testCaseSchema = {
  name: z.string().describe("Test case name"),
  user_input: z.string().describe("The simulated user input"),
  expected_output: z.string().describe("The expected agent output"),
  persona_id: z
    .string()
    .optional()
    .describe("Persona id to associate with this test case"),
  scenario_id: z
    .string()
    .optional()
    .describe("Scenario id to associate with this test case"),
};

const scenarioSchema = {
  name: z.string().describe("Scenario name"),
  description: z.string().describe("Scenario description"),
};

/** Register the World Model tools. */
export const registerWorldModelCoreTools = (
  server: McpServer,
  client: WorldModelCoreClient,
) => {
  server.registerTool(
    "lyzr_world_model_list_by_agent",
    {
      title: "List World Models By Agent",
      description: "List all world models built from a given source agent.",
      inputSchema: {
        agent_id: z.string().describe("The source agent id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.listByAgent(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_create",
    {
      title: "Create World Model",
      description:
        "Create a world model (a simulation clone) from a source agent. Returns the world_model_id.",
      inputSchema: {
        source_agent_id: z
          .string()
          .describe("The agent id to build the world model from"),
        name: z
          .string()
          .optional()
          .describe("Optional name for the world model"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ source_agent_id, name }, extra) =>
      txt(
        await client.createWorldModel(
          { source_agent_id, name: name ?? null },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_world_model_get",
    {
      title: "Get World Model",
      description: "Fetch a world model by id.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.getWorldModel(world_model_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_delete",
    {
      title: "Delete World Model",
      description: "Permanently delete a world model by id.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.deleteWorldModel(world_model_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_add_personas",
    {
      title: "Add World Model Personas",
      description: "Add one or more personas to a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        personas: z
          .array(z.object(personaSchema))
          .min(1)
          .describe("Personas to add"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, personas }, extra) =>
      txt(await client.addPersonas(world_model_id, personas, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_list_personas",
    {
      title: "List World Model Personas",
      description: "List the personas defined on a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.listPersonas(world_model_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_update_persona",
    {
      title: "Update World Model Persona",
      description: "Update a persona on a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        persona_id: z.string().describe("The persona id to update"),
        ...personaSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, persona_id, name, description }, extra) =>
      txt(
        await client.updatePersona(
          world_model_id,
          persona_id,
          { name, description },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_world_model_delete_persona",
    {
      title: "Delete World Model Persona",
      description: "Delete a persona from a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        persona_id: z.string().describe("The persona id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, persona_id }, extra) =>
      txt(await client.deletePersona(world_model_id, persona_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_add_test_cases",
    {
      title: "Add World Model Test Cases",
      description: "Add one or more test cases to a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        test_cases: z
          .array(z.object(testCaseSchema))
          .min(1)
          .describe("Test cases to add"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, test_cases }, extra) =>
      txt(await client.addTestCases(world_model_id, test_cases, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_list_test_cases",
    {
      title: "List World Model Test Cases",
      description: "List the test cases defined on a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.listTestCases(world_model_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_update_test_case",
    {
      title: "Update World Model Test Case",
      description: "Update a test case on a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        test_case_id: z.string().describe("The test case id to update"),
        ...testCaseSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (
      {
        world_model_id,
        test_case_id,
        name,
        user_input,
        expected_output,
        persona_id,
        scenario_id,
      },
      extra,
    ) =>
      txt(
        await client.updateTestCase(
          world_model_id,
          test_case_id,
          {
            name,
            user_input,
            expected_output,
            persona_id: persona_id ?? null,
            scenario_id: scenario_id ?? null,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_world_model_delete_test_case",
    {
      title: "Delete World Model Test Case",
      description: "Delete a test case from a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        test_case_id: z.string().describe("The test case id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, test_case_id }, extra) =>
      txt(
        await client.deleteTestCase(world_model_id, test_case_id, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_world_model_add_scenarios",
    {
      title: "Add World Model Scenarios",
      description: "Add one or more scenarios to a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        scenarios: z
          .array(z.object(scenarioSchema))
          .min(1)
          .describe("Scenarios to add"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, scenarios }, extra) =>
      txt(await client.addScenarios(world_model_id, scenarios, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_list_scenarios",
    {
      title: "List World Model Scenarios",
      description: "List the scenarios defined on a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.listScenarios(world_model_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_update_scenario",
    {
      title: "Update World Model Scenario",
      description: "Update a scenario on a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        scenario_id: z.string().describe("The scenario id to update"),
        ...scenarioSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, scenario_id, name, description }, extra) =>
      txt(
        await client.updateScenario(
          world_model_id,
          scenario_id,
          { name, description },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_world_model_delete_scenario",
    {
      title: "Delete World Model Scenario",
      description: "Delete a scenario from a world model.",
      inputSchema: {
        world_model_id: z.string().describe("The world model id"),
        scenario_id: z.string().describe("The scenario id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id, scenario_id }, extra) =>
      txt(
        await client.deleteScenario(world_model_id, scenario_id, extra.signal),
      ),
  );
};
