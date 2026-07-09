import { describe, it, expect, afterEach } from "vitest";
import {
  getStdioKey,
  extractHttpKey,
  getBaseUrl,
  DEFAULT_BASE_URL,
  MissingApiKeyError,
} from "../src/config";

describe("config", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("getStdioKey returns the (trimmed) env key when set", () => {
    process.env.LYZR_API_KEY = "  key-xyz  ";
    expect(getStdioKey()).toBe("key-xyz");
  });

  it("getStdioKey throws MissingApiKeyError when unset", () => {
    delete process.env.LYZR_API_KEY;
    expect(() => getStdioKey()).toThrow(MissingApiKeyError);
  });

  it("getBaseUrl defaults to production and honors override", () => {
    delete process.env.LYZR_API_BASE_URL;
    expect(getBaseUrl()).toBe(DEFAULT_BASE_URL);
    process.env.LYZR_API_BASE_URL = "https://custom.test/v9";
    expect(getBaseUrl()).toBe("https://custom.test/v9");
  });

  it("extractHttpKey reads x-api-key", () => {
    expect(extractHttpKey({ "x-api-key": "abc" })).toBe("abc");
  });

  it("extractHttpKey reads Authorization: Bearer", () => {
    expect(extractHttpKey({ authorization: "Bearer tok-123" })).toBe("tok-123");
  });

  it("extractHttpKey throws when no key present", () => {
    expect(() => extractHttpKey({})).toThrow(MissingApiKeyError);
  });
});
