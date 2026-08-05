/**
 * Lyzr World Model client (host: agent-prod).
 * Endpoints/shapes confirmed against the World Model v3 OpenAPI tag.
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface WorldModelCreateInput {
  source_agent_id: string;
  name?: string | null;
}

export interface WorldModelCreateResult {
  world_model_id: string;
  source_agent_id: string;
  cloned_agent_id: string;
  name: string;
  created_at: string;
  [key: string]: unknown;
}

export interface WorldModel {
  world_model_id?: string;
  [key: string]: unknown;
}

export interface PersonaInput {
  name: string;
  description: string;
}

export interface TestCaseInput {
  name: string;
  user_input: string;
  expected_output: string;
  persona_id?: string | null;
  scenario_id?: string | null;
}

export interface ScenarioInput {
  name: string;
  description: string;
}

export class WorldModelCoreClient extends LyzrHttp {
  /** List world models for an agent. GET /v3/world_model/by_agent/{agent_id} */
  async listByAgent(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<WorldModel[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/world_model/by_agent/${encodeURIComponent(agentId)}`,
      { signal },
    );
    return normalizeList<WorldModel>(raw, "world_models");
  }

  /** Create a world model. POST /v3/world_model/create */
  createWorldModel(
    input: WorldModelCreateInput,
    signal?: AbortSignal,
  ): Promise<WorldModelCreateResult> {
    return this.request<WorldModelCreateResult>(
      "POST",
      "/v3/world_model/create",
      { body: input, signal },
    );
  }

  /** Get a world model. GET /v3/world_model/{world_model_id} */
  getWorldModel(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<WorldModel> {
    return this.request<WorldModel>(
      "GET",
      `/v3/world_model/${encodeURIComponent(worldModelId)}`,
      { signal },
    );
  }

  /** Delete a world model. DELETE /v3/world_model/{world_model_id} */
  deleteWorldModel(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/world_model/${encodeURIComponent(worldModelId)}`,
      { signal },
    );
  }

  /** Add personas to a world model. POST /v3/world_model/{world_model_id}/personas */
  addPersonas(
    worldModelId: string,
    personas: PersonaInput[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/personas`,
      { body: { personas }, signal },
    );
  }

  /** List personas for a world model. GET /v3/world_model/{world_model_id}/personas */
  async listPersonas(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/personas`,
      { signal },
    );
    return normalizeList<unknown>(raw, "personas");
  }

  /** Update a persona. PUT /v3/world_model/{world_model_id}/personas/{persona_id} */
  updatePersona(
    worldModelId: string,
    personaId: string,
    input: PersonaInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/personas/${encodeURIComponent(personaId)}`,
      { body: input, signal },
    );
  }

  /** Delete a persona. DELETE /v3/world_model/{world_model_id}/personas/{persona_id} */
  deletePersona(
    worldModelId: string,
    personaId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/personas/${encodeURIComponent(personaId)}`,
      { signal },
    );
  }

  /** Add test cases to a world model. POST /v3/world_model/{world_model_id}/test_cases */
  addTestCases(
    worldModelId: string,
    testCases: TestCaseInput[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/test_cases`,
      { body: { test_cases: testCases }, signal },
    );
  }

  /** List test cases for a world model. GET /v3/world_model/{world_model_id}/test_cases */
  async listTestCases(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/test_cases`,
      { signal },
    );
    return normalizeList<unknown>(raw, "test_cases");
  }

  /** Update a test case. PUT /v3/world_model/{world_model_id}/test_cases/{test_case_id} */
  updateTestCase(
    worldModelId: string,
    testCaseId: string,
    input: TestCaseInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/test_cases/${encodeURIComponent(testCaseId)}`,
      { body: input, signal },
    );
  }

  /** Delete a test case. DELETE /v3/world_model/{world_model_id}/test_cases/{test_case_id} */
  deleteTestCase(
    worldModelId: string,
    testCaseId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/test_cases/${encodeURIComponent(testCaseId)}`,
      { signal },
    );
  }

  /** Add scenarios to a world model. POST /v3/world_model/{world_model_id}/scenarios */
  addScenarios(
    worldModelId: string,
    scenarios: ScenarioInput[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/scenarios`,
      { body: { scenarios }, signal },
    );
  }

  /** List scenarios for a world model. GET /v3/world_model/{world_model_id}/scenarios */
  async listScenarios(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/scenarios`,
      { signal },
    );
    return normalizeList<unknown>(raw, "scenarios");
  }

  /** Update a scenario. PUT /v3/world_model/{world_model_id}/scenarios/{scenario_id} */
  updateScenario(
    worldModelId: string,
    scenarioId: string,
    input: ScenarioInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/scenarios/${encodeURIComponent(scenarioId)}`,
      { body: input, signal },
    );
  }

  /** Delete a scenario. DELETE /v3/world_model/{world_model_id}/scenarios/{scenario_id} */
  deleteScenario(
    worldModelId: string,
    scenarioId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/scenarios/${encodeURIComponent(scenarioId)}`,
      { signal },
    );
  }
}
