import { test, describe } from "node:test";
import assert from "node:assert";
import { formatApiErrorMessage } from "../mcp-server.js";

describe("formatApiErrorMessage", () => {
  test("returns specific message for status 401", () => {
    const result = formatApiErrorMessage("Unauthorized access", 401);
    assert.strictEqual(
      result,
      'Invalid API key (Unauthorized access). Run "seerxo login" to refresh credentials.',
    );
  });

  test("returns specific message for status 403", () => {
    const result = formatApiErrorMessage("Forbidden", 403);
    assert.strictEqual(
      result,
      'Invalid API key (Forbidden). Run "seerxo login" to refresh credentials.',
    );
  });

  test("returns specific message for status 401 with no message", () => {
    const result = formatApiErrorMessage(undefined, 401);
    assert.strictEqual(
      result,
      'Invalid API key. Run "seerxo login" to refresh credentials.',
    );
  });

  test("returns specific message when message matches invalid api key patterns", () => {
    const messages = [
      "invalid api key",
      "API KEY NOT FOUND",
      "your api key is INACTIVE",
    ];

    for (const msg of messages) {
      const result = formatApiErrorMessage(msg, 500);
      assert.strictEqual(
        result,
        `Invalid API key (${msg}). Run "seerxo login" to refresh credentials.`,
      );
    }
  });

  test("returns original message for generic errors", () => {
    const result = formatApiErrorMessage("Some server error", 500);
    assert.strictEqual(result, "Some server error");
  });

  test("returns default generic message when message is falsy or non-string", () => {
    const expected = "Failed to generate Etsy SEO content";
    assert.strictEqual(formatApiErrorMessage(undefined, 500), expected);
    assert.strictEqual(formatApiErrorMessage(null, 500), expected);
    assert.strictEqual(formatApiErrorMessage("", 500), expected);
    assert.strictEqual(formatApiErrorMessage({ error: "test" }, 500), expected);
  });

  test("appends requestId when provided", () => {
    const result = formatApiErrorMessage("Server error", 500, "req_123");
    assert.strictEqual(result, "Server error [request req_123]");

    const invalidKeyResult = formatApiErrorMessage(
      "Unauthorized",
      401,
      "req_456",
    );
    assert.strictEqual(
      invalidKeyResult,
      'Invalid API key (Unauthorized). Run "seerxo login" to refresh credentials. [request req_456]',
    );
  });
});
