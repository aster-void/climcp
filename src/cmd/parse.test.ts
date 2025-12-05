import { describe, test, expect } from "bun:test";
import {
  parseInvocation,
  parseJson5Payload,
  parseQueryStyle,
  parsePayload,
} from "./parse.ts";

describe("parseInvocation", () => {
  test("parses tool name only", () => {
    const result = parseInvocation("my_tool");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toolName).toBe("my_tool");
      expect(result.value.payloadText).toBe("");
    }
  });

  test("parses tool name with payload", () => {
    const result = parseInvocation("my_tool { key: 'value' }");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toolName).toBe("my_tool");
      expect(result.value.payloadText).toBe("{ key: 'value' }");
    }
  });

  test("fails on empty input", () => {
    const result = parseInvocation("");
    expect(result.ok).toBe(false);
  });
});

describe("parseJson5Payload", () => {
  test("parses JSON object", () => {
    const result = parseJson5Payload('{ "key": "value" }');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ key: "value" });
    }
  });

  test("parses JSON5 (unquoted keys, trailing commas)", () => {
    const result = parseJson5Payload("{ key: 'value', }");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ key: "value" });
    }
  });

  test("fails on non-object", () => {
    const result = parseJson5Payload('"just a string"');
    expect(result.ok).toBe(false);
  });

  test("allows empty when allowEmpty is true", () => {
    const result = parseJson5Payload("", true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({});
    }
  });

  test("fails on empty when allowEmpty is false", () => {
    const result = parseJson5Payload("", false);
    expect(result.ok).toBe(false);
  });
});

describe("parseQueryStyle", () => {
  test("parses simple key=value", () => {
    const result = parseQueryStyle("path=.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "." });
    }
  });

  test("parses multiple key=value pairs", () => {
    const result = parseQueryStyle("path=. recursive=true");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: ".", recursive: true });
    }
  });

  test("parses quoted values", () => {
    const result = parseQueryStyle('message="hello world" name=\'John Doe\'');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ message: "hello world", name: "John Doe" });
    }
  });

  test("converts boolean strings", () => {
    const result = parseQueryStyle("enabled=true disabled=false");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ enabled: true, disabled: false });
    }
  });

  test("converts number strings", () => {
    const result = parseQueryStyle("count=42 ratio=3.14");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ count: 42, ratio: 3.14 });
    }
  });

  test("converts null string", () => {
    const result = parseQueryStyle("value=null");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ value: null });
    }
  });

  test("fails on invalid format (no equals)", () => {
    const result = parseQueryStyle("invalid-no-equals");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("expected key=value");
    }
  });

  test("returns empty object for empty input", () => {
    const result = parseQueryStyle("");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({});
    }
  });
});

describe("parsePayload", () => {
  test("auto-detects JSON format", () => {
    const result = parsePayload('{ "path": "." }');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "." });
    }
  });

  test("auto-detects query format", () => {
    const result = parsePayload("path=.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "." });
    }
  });
});
