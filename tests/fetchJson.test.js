import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { fetchJson } from "../mcp-server.js";

const originalFetch = global.fetch;

describe("fetchJson", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should return parsed JSON data on 200 OK", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ foo: "bar" }),
    });

    const data = await fetchJson("https://example.com/api");
    assert.deepEqual(data, { foo: "bar" });
  });

  it("should return an empty object on 200 OK with invalid JSON", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const data = await fetchJson("https://example.com/api");
    assert.deepEqual(data, {});
  });

  it("should throw an error with the `error` property when response is not ok", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ error: "Bad Request from server" }),
    });

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.strictEqual(err.message, "Bad Request from server");
        assert.strictEqual(err.status, 400);
        assert.deepEqual(err.payload, { error: "Bad Request from server" });
        return true;
      },
    );
  });

  it("should throw an error with the `message` property when response is not ok", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 403,
      headers: new Headers(),
      json: async () => ({ message: "Forbidden access" }),
    });

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.strictEqual(err.message, "Forbidden access");
        assert.strictEqual(err.status, 403);
        assert.deepEqual(err.payload, { message: "Forbidden access" });
        return true;
      },
    );
  });

  it("should throw a fallback error message if JSON is empty or invalid on non-200 response", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.strictEqual(err.message, "Request failed (500)");
        assert.strictEqual(err.status, 500);
        assert.strictEqual(err.payload, null);
        return true;
      },
    );
  });

  it("should pass an abort signal to fetch", async () => {
    let seenSignal = null;
    global.fetch = async (url, options) => {
      seenSignal = options.signal;
      return { ok: true, json: async () => ({}) };
    };

    await fetchJson("https://example.com/api");
    assert.ok(seenSignal instanceof AbortSignal);
  });

  it("should map timeout aborts to a friendly error with code 'timeout'", async () => {
    global.fetch = async () => {
      const err = new Error("The operation was aborted due to timeout");
      err.name = "TimeoutError";
      throw err;
    };

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.match(err.message, /timed out after \d+s/);
        assert.strictEqual(err.code, "timeout");
        return true;
      },
    );
  });

  it("should propagate fetch network errors", async () => {
    global.fetch = async () => {
      throw new Error("Network failure");
    };

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.strictEqual(err.message, "Network failure");
        return true;
      },
    );
  });

  it("should handle x-request-id header correctly on error", async () => {
    const headers = new Headers();
    headers.set("x-request-id", "req-123");
    global.fetch = async () => ({
      ok: false,
      status: 500,
      headers,
      json: async () => ({ error: "Internal error" }),
    });

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.strictEqual(err.message, "Internal error [request req-123]");
        assert.strictEqual(err.requestId, "req-123");
        return true;
      },
    );
  });

  it("should include code property on the error if available", async () => {
    const headers = new Headers();
    global.fetch = async () => ({
      ok: false,
      status: 429,
      headers,
      json: async () => ({
        error: "Too Many Requests",
        code: "RATE_LIMIT_EXCEEDED",
      }),
    });

    await assert.rejects(
      async () => await fetchJson("https://example.com/api"),
      (err) => {
        assert.strictEqual(err.message, "Too Many Requests");
        assert.strictEqual(err.code, "RATE_LIMIT_EXCEEDED");
        return true;
      },
    );
  });
});
