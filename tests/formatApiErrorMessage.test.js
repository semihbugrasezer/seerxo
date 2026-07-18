import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatApiErrorMessage } from "../mcp-server.js";

describe("formatApiErrorMessage", () => {
  describe("authentication errors", () => {
    it("handles 401 Unauthorized status", () => {
      assert.strictEqual(
        formatApiErrorMessage("Some error", 401),
        'Invalid API key (Some error). Run "seerxo login" to refresh credentials.',
      );
    });

    it("handles 403 Forbidden status", () => {
      assert.strictEqual(
        formatApiErrorMessage("Another error", 403),
        'Invalid API key (Another error). Run "seerxo login" to refresh credentials.',
      );
    });

    it("handles empty message with 401/403 status", () => {
      assert.strictEqual(
        formatApiErrorMessage("", 401),
        'Invalid API key. Run "seerxo login" to refresh credentials.',
      );
      assert.strictEqual(
        formatApiErrorMessage(undefined, 403),
        'Invalid API key. Run "seerxo login" to refresh credentials.',
      );
    });

    it("detects invalid api key from string matching", () => {
      const messages = [
        "Invalid API key provided",
        "api key not found in request",
        "the api key is INACTIVE",
      ];

      for (const msg of messages) {
        assert.strictEqual(
          formatApiErrorMessage(msg, 500),
          `Invalid API key (${msg}). Run "seerxo login" to refresh credentials.`,
        );
      }
    });
  });

  describe("general errors", () => {
    it("returns the normalized message for other errors", () => {
      assert.strictEqual(
        formatApiErrorMessage("Rate limit exceeded", 429),
        "Rate limit exceeded",
      );
    });

    it("provides a fallback message when message is empty or missing", () => {
      assert.strictEqual(
        formatApiErrorMessage("", 500),
        "Failed to generate Etsy SEO content",
      );
      assert.strictEqual(
        formatApiErrorMessage(null, 500),
        "Failed to generate Etsy SEO content",
      );
      assert.strictEqual(
        formatApiErrorMessage(undefined, 500),
        "Failed to generate Etsy SEO content",
      );
    });

    it("handles non-string message types gracefully", () => {
      assert.strictEqual(
        formatApiErrorMessage({ error: "object" }, 500),
        "Failed to generate Etsy SEO content",
      );
      assert.strictEqual(
        formatApiErrorMessage(["array"], 500),
        "Failed to generate Etsy SEO content",
      );
    });
  });

  describe("requestId appending", () => {
    it("appends requestId when provided", () => {
      assert.strictEqual(
        formatApiErrorMessage("Server error", 500, "req-123"),
        "Server error [request req-123]",
      );
    });

    it("appends requestId to auth errors", () => {
      assert.strictEqual(
        formatApiErrorMessage("Bad token", 401, "req-456"),
        'Invalid API key (Bad token). Run "seerxo login" to refresh credentials. [request req-456]',
      );
    });

    it("appends requestId to fallback message", () => {
      assert.strictEqual(
        formatApiErrorMessage(undefined, 500, "req-789"),
        "Failed to generate Etsy SEO content [request req-789]",
      );
    });

    it("does not append requestId if it is already in the message", () => {
      assert.strictEqual(
        formatApiErrorMessage("Error with req-123 failed", 500, "req-123"),
        "Error with req-123 failed",
      );
    });

    it("does not append requestId to auth errors if already present", () => {
      assert.strictEqual(
        formatApiErrorMessage("Invalid api key (req-456)", 500, "req-456"),
        'Invalid API key (Invalid api key (req-456)). Run "seerxo login" to refresh credentials.',
      );
    });
  });
});
