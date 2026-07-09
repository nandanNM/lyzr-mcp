/**
 * Scheduler client — host: scheduler.studio.
 * Endpoints/shapes confirmed against the lyzr-adk SDK. Note: paths have NO /v3 prefix.
 */
import { LyzrHttp } from "./http.js";

export interface CreateScheduleInput {
  user_id: string;
  agent_id: string;
  cron_expression: string; // 5-field cron: "minute hour day month weekday"
  message?: string;
  timezone?: string; // IANA tz, default UTC
  max_retries?: number;
  retry_delay?: number;
}

export class SchedulerClient extends LyzrHttp {
  /** Create a schedule. POST /schedules/ */
  create(input: CreateScheduleInput, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/schedules/", {
      body: {
        user_id: input.user_id,
        agent_id: input.agent_id,
        cron_expression: input.cron_expression,
        message: input.message ?? "",
        timezone: input.timezone ?? "UTC",
        max_retries: input.max_retries ?? 3,
        retry_delay: input.retry_delay ?? 60,
      },
      signal,
    });
  }

  /** List schedules. GET /schedules/ */
  list(userId?: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/schedules/", {
      params: { user_id: userId },
      signal,
    });
  }

  /** Get a schedule. GET /schedules/{id} */
  get(scheduleId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/schedules/${encodeURIComponent(scheduleId)}`,
      { signal },
    );
  }

  /** Delete a schedule. DELETE /schedules/{id} */
  delete(scheduleId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/schedules/${encodeURIComponent(scheduleId)}`,
      { signal },
    );
  }

  /** Pause / resume / trigger a schedule. POST /schedules/{id}/{action} */
  private action(
    scheduleId: string,
    verb: "pause" | "resume" | "trigger",
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/schedules/${encodeURIComponent(scheduleId)}/${verb}`,
      { body: {}, signal },
    );
  }

  pause = (id: string, signal?: AbortSignal) =>
    this.action(id, "pause", signal);
  resume = (id: string, signal?: AbortSignal) =>
    this.action(id, "resume", signal);
  trigger = (id: string, signal?: AbortSignal) =>
    this.action(id, "trigger", signal);
}
