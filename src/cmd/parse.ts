import JSON5 from "json5";
import { parse as shellParse } from "shell-quote";
import { err, ok, type Result } from "../lib/result.ts";
import { getErrorMessage } from "../lib/errors.ts";
import * as v from "valibot";

export type ToolInvocation = {
  toolName: string;
  payloadText: string;
};

export function parseInvocation(input: string): Result<ToolInvocation> {
  const firstSpace = input.indexOf(" ");
  const hasPayload = firstSpace !== -1;
  const toolName = hasPayload
    ? input.slice(0, firstSpace).trim()
    : input.trim();
  const payloadText = hasPayload ? input.slice(firstSpace + 1).trim() : "";
  if (!toolName) {
    return err(new Error("Error: tool name is required"));
  }
  return ok({ toolName, payloadText });
}

export function parseJson5Payload(
  text: string,
  allowEmpty = false,
): Result<Record<string, unknown>> {
  const trimmed = text.trim();
  if (!trimmed && allowEmpty) {
    return ok({});
  }
  if (!trimmed) {
    return err(new Error("Error: JSON payload is required"));
  }
  try {
    const parsedValue: unknown = JSON5.parse(trimmed);
    const validation = v.safeParse(
      v.record(v.string(), v.unknown()),
      parsedValue,
    );
    if (!validation.success) {
      const firstIssue = validation.issues.at(0);
      const detail = firstIssue?.message ?? "JSON payload must be an object";
      return err(new Error(`Error: ${detail}`));
    }
    return ok(validation.output);
  } catch (error) {
    return err(new Error(`Failed to parse JSON5: ${getErrorMessage(error)}`));
  }
}

export function parseQueryStyle(text: string): Result<Record<string, unknown>> {
  const trimmed = text.trim();
  if (!trimmed) {
    return ok({});
  }

  const parts = shellParse(trimmed);
  return parseQueryStyleParts(parts);
}

// Parse pre-split CLI args (already processed by shell, no need to re-parse quotes).
export function parseQueryStyleArgs(
  args: string[],
): Result<Record<string, unknown>> {
  if (args.length === 0) {
    return ok({});
  }
  return parseQueryStyleParts(args);
}

function parseQueryStyleParts(
  parts: ReturnType<typeof shellParse>,
): Result<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const part of parts) {
    if (typeof part !== "string") {
      return err(new Error(`Unsupported shell operator in arguments`));
    }
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) {
      return err(
        new Error(`Invalid argument format: "${part}" (expected key=value)`),
      );
    }
    const key = part.slice(0, eqIndex);
    const value = part.slice(eqIndex + 1);
    if (!key) {
      return err(new Error(`Empty key in argument: "${part}"`));
    }
    result[key] = parseValue(value);
  }
  return ok(result);
}

function parseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  const num = Number(value);
  if (!Number.isNaN(num) && value !== "") return num;
  return value;
}

export function parsePayload(
  input: string,
  allowEmpty = false,
): Result<Record<string, unknown>> {
  const trimmed = input.trim();
  if (!trimmed && allowEmpty) {
    return ok({});
  }
  if (!trimmed) {
    return err(new Error("Error: payload is required"));
  }
  if (trimmed.startsWith("{")) {
    return parseJson5Payload(trimmed, allowEmpty);
  }
  return parseQueryStyle(trimmed);
}
