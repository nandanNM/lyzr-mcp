/**
 * Shared HTTP layer for all Lyzr services.
 *
 * Lyzr splits its API across several hosts (agent, rag, memory, scheduler, rai).
 * `LyzrHttp` holds one service's base URL + the caller's key and does the actual
 * request; each service client (agents, KB, memory, ...) extends it with a
 * different base URL. The key lives only here — never logged, never in errors.
 */

/** The set of Lyzr service base URLs (confirmed from the lyzr-adk SDK). */
export interface ServiceUrls {
  agent: string;
  rag: string;
  memory: string;
  scheduler: string;
  rai: string;
}

/** Production defaults for every Lyzr service. */
export const DEFAULT_SERVICE_URLS: ServiceUrls = {
  agent: "https://agent-prod.studio.lyzr.ai",
  rag: "https://rag-prod.studio.lyzr.ai",
  memory: "https://memory.studio.lyzr.ai",
  scheduler: "https://scheduler.studio.lyzr.ai",
  rai: "https://rai-prod.studio.lyzr.ai",
};

/** Error raised when a Lyzr API returns a non-2xx response. Never carries the key. */
export class LyzrApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Lyzr API error ${status}: ${LyzrApiError.friendly(status, body)}`);
    this.name = "LyzrApiError";
  }

  static friendly(status: number, body: string): string {
    if (status === 401 || status === 403) {
      return "authentication failed — check your Lyzr API key.";
    }
    if (status === 404) return "not found — check the id / endpoint.";
    if (status === 422) return "validation error — check the request fields.";
    if (status === 429) return "rate limited — slow down and retry.";
    const snippet = body.slice(0, 300);
    return snippet || "no response body.";
  }
}

export interface RequestOptions {
  body?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  /** Extra headers to merge on top of the default x-api-key/Content-Type/Accept set. */
  headers?: Record<string, string>;
}

export interface LyzrHttpConfig {
  apiKey: string;
  baseUrl: string;
  /** Injectable for tests; defaults to the global fetch (Node >= 18). */
  fetchImpl?: typeof fetch;
}

/** Normalize a list response that may be an array or wrapped in a named key. */
export const normalizeList = <T = unknown>(
  raw: unknown,
  ...keys: string[]
): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const k of [...keys, "data", "results"]) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
  }
  return [];
};

export class LyzrHttp {
  protected readonly apiKey: string;
  protected readonly baseUrl: string;
  protected readonly fetchImpl: typeof fetch;

  constructor(cfg: LyzrHttpConfig) {
    const f = cfg.fetchImpl ?? globalThis.fetch;
    if (!f) {
      throw new Error(
        "global fetch is unavailable — Node >= 18 is required, or pass fetchImpl.",
      );
    }
    this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl;
    this.fetchImpl = f.bind(globalThis) as typeof fetch;
  }

  protected headers(extra?: Record<string, string>): Record<string, string> {
    return {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(extra ?? {}),
    };
  }

  protected buildUrl(path: string, params?: Record<string, unknown>): string {
    const base = `${this.baseUrl}${path}`;
    if (!params) return base;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      qs.append(k, String(v));
    }
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  }

  protected async request<T>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const res = await this.fetchImpl(this.buildUrl(path, opts.params), {
      method,
      headers: this.headers(opts.headers),
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  /**
   * Like {@link request}, but returns the raw response body as a string
   * instead of JSON-parsing it. Use for endpoints that return CSV/plain
   * text (e.g. report-CSV exports) — JSON.parse-ing those throws a raw
   * SyntaxError instead of a helpful LyzrApiError.
   */
  protected async requestText(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<string> {
    const res = await this.fetchImpl(this.buildUrl(path, opts.params), {
      method,
      headers: this.headers(opts.headers),
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    return res.text();
  }
}
