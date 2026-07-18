import test from "node:test";
import assert from "node:assert";
import { normalizeHost, DEFAULT_HOST } from "../utils.js";

test("normalizeHost", async (t) => {
  await t.test("returns DEFAULT_HOST for falsy or empty values", () => {
    assert.strictEqual(normalizeHost(), DEFAULT_HOST);
    assert.strictEqual(normalizeHost(""), DEFAULT_HOST);
    assert.strictEqual(normalizeHost(null), DEFAULT_HOST);
    assert.strictEqual(normalizeHost(undefined), DEFAULT_HOST);
    assert.strictEqual(normalizeHost(0), DEFAULT_HOST);
  });

  await t.test(
    "returns valid HTTP/HTTPS URLs without trailing slashes, hashes, or search params",
    () => {
      assert.strictEqual(
        normalizeHost("http://example.com"),
        "http://example.com",
      );
      assert.strictEqual(
        normalizeHost("https://example.com"),
        "https://example.com",
      );
      assert.strictEqual(
        normalizeHost("  https://example.com  "),
        "https://example.com",
      );
      assert.strictEqual(
        normalizeHost("https://example.com/"),
        "https://example.com",
      );
      assert.strictEqual(
        normalizeHost("https://example.com/api/"),
        "https://example.com/api",
      );
      assert.strictEqual(
        normalizeHost("https://example.com?query=1"),
        "https://example.com",
      );
      assert.strictEqual(
        normalizeHost("https://example.com#hash"),
        "https://example.com",
      );
      assert.strictEqual(
        normalizeHost("https://example.com/api/?query=1#hash"),
        "https://example.com/api",
      );
    },
  );

  await t.test("returns DEFAULT_HOST for invalid protocols", () => {
    assert.strictEqual(normalizeHost("ftp://example.com"), DEFAULT_HOST);
    assert.strictEqual(normalizeHost("ws://example.com"), DEFAULT_HOST);
    assert.strictEqual(normalizeHost("file:///C:/path/to/file"), DEFAULT_HOST);
  });

  await t.test(
    "returns DEFAULT_HOST for URLs with embedded credentials",
    () => {
      assert.strictEqual(
        normalizeHost("https://user:pass@example.com"),
        DEFAULT_HOST,
      );
      assert.strictEqual(
        normalizeHost("http://user@example.com"),
        DEFAULT_HOST,
      );
    },
  );

  await t.test("returns DEFAULT_HOST for invalid/malformed URL strings", () => {
    assert.strictEqual(normalizeHost("not a url"), DEFAULT_HOST);
    assert.strictEqual(normalizeHost("http://"), DEFAULT_HOST);
  });
});
