import { describe, it } from "node:test";
import assert from "node:assert";
import { resolveApiKeyState } from "../mcp-server.js";

describe("resolveApiKeyState", () => {
  it("should parse a valid API key correctly", () => {
    const keyId = "my-valid-key-id";
    const secret = "my-valid-secret-123456"; // >= 16 chars
    const result = resolveApiKeyState(`${keyId}.${secret}`);

    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.parts, [keyId, secret]);
    assert.strictEqual(result.secret, secret);
    assert.strictEqual(result.header, `${keyId}.${secret}`);
  });

  it("should trim whitespace from a valid API key", () => {
    const keyId = "my-valid-key-id";
    const secret = "my-valid-secret-123456";
    const result = resolveApiKeyState(`  ${keyId}.${secret}  `);

    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.parts, [keyId, secret]);
    assert.strictEqual(result.secret, secret);
    assert.strictEqual(result.header, `${keyId}.${secret}`);
  });

  it("should return isValid=false for keys missing a dot", () => {
    const result = resolveApiKeyState("just-a-key-without-dot");

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, ["just-a-key-without-dot"]);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false for keys with too many dots", () => {
    const result = resolveApiKeyState("keyId.secret.extra");

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, ["keyId", "secret", "extra"]);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false when secret is too short (< 16 chars)", () => {
    const keyId = "keyId";
    const secret = "short-secret"; // < 16 chars
    const result = resolveApiKeyState(`${keyId}.${secret}`);

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, [keyId, secret]);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false when keyId is missing", () => {
    const secret = "my-valid-secret-123456";
    const result = resolveApiKeyState(`.${secret}`);

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, ["", secret]);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false when secret is missing", () => {
    const keyId = "keyId";
    const result = resolveApiKeyState(`${keyId}.`);

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, [keyId, ""]);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false for empty string input", () => {
    const result = resolveApiKeyState("");

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, []);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false for whitespace-only string input", () => {
    const result = resolveApiKeyState("   ");

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, []);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false for null input", () => {
    const result = resolveApiKeyState(null);

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, []);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false for undefined input", () => {
    const result = resolveApiKeyState(undefined);

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, []);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });

  it("should return isValid=false for object input", () => {
    const result = resolveApiKeyState({});

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.parts, []);
    assert.strictEqual(result.secret, null);
    assert.strictEqual(result.header, null);
  });
});
