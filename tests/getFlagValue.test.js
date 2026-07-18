import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { getFlagValue } from "../mcp-server.js";

describe("getFlagValue", () => {
  it("should return the value when flag is present with a valid value", () => {
    const list = ["node", "script.js", "--foo", "bar"];
    strictEqual(getFlagValue("foo", list), "bar");
  });

  it("should return null when the flag does not exist", () => {
    const list = ["node", "script.js", "--bar", "baz"];
    strictEqual(getFlagValue("foo", list), null);
  });

  it("should return null when the flag is the last item", () => {
    const list = ["node", "script.js", "--foo"];
    strictEqual(getFlagValue("foo", list), null);
  });

  it("should return null when the next item is another flag", () => {
    const list = ["node", "script.js", "--foo", "--bar"];
    strictEqual(getFlagValue("foo", list), null);
  });

  it("should return null when the list is empty", () => {
    const list = [];
    strictEqual(getFlagValue("foo", list), null);
  });

  it("should return null when the list is not provided", () => {
    strictEqual(getFlagValue("foo"), null);
  });
});
