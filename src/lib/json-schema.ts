import * as v from "valibot";
import { cyan, blue, yellow, green, dim } from "./colors.ts";

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  description?: string;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  [key: string]: unknown;
};

const jsonSchemaSchema: v.GenericSchema<JsonSchema> = v.looseObject({
  type: v.optional(v.union([v.string(), v.array(v.string())])),
  properties: v.optional(
    v.record(
      v.string(),
      v.lazy(() => jsonSchemaSchema),
    ),
  ),
  required: v.optional(v.array(v.string())),
  items: v.optional(v.lazy(() => jsonSchemaSchema)),
  enum: v.optional(v.array(v.unknown())),
  description: v.optional(v.string()),
  anyOf: v.optional(v.array(v.lazy(() => jsonSchemaSchema))),
  oneOf: v.optional(v.array(v.lazy(() => jsonSchemaSchema))),
  allOf: v.optional(v.array(v.lazy(() => jsonSchemaSchema))),
});

export function parseJsonSchema(input: unknown): JsonSchema {
  return v.parse(jsonSchemaSchema, input);
}

export function toTSStyle(schema: JsonSchema, indent = 0): string {
  const ind = "  ".repeat(indent);
  const innerInd = "  ".repeat(indent + 1);

  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  }

  if (schema.anyOf) {
    return schema.anyOf.map((s) => toTSStyle(s, indent)).join(" | ");
  }

  if (schema.oneOf) {
    return schema.oneOf.map((s) => toTSStyle(s, indent)).join(" | ");
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => toTSStyle(s, indent)).join(" & ");
  }

  const types = Array.isArray(schema.type) ? schema.type : [schema.type];

  if (types.includes("array") && schema.items) {
    return `${toTSStyle(schema.items, indent)}[]`;
  }

  if (types.includes("object") && schema.properties) {
    const requiredSet = new Set(schema.required || []);
    const lines: string[] = ["{"];

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const optional = requiredSet.has(key) ? "" : "?";
      const propType = toTSStyle(propSchema, indent + 1);
      const desc = propSchema.description
        ? ` // ${propSchema.description}`
        : "";
      lines.push(`${innerInd}${key}${optional}: ${propType};${desc}`);
    }

    lines.push(`${ind}}`);
    return lines.join("\n");
  }

  if (types.includes("string")) return "string";
  if (types.includes("number")) return "number";
  if (types.includes("integer")) return "number";
  if (types.includes("boolean")) return "boolean";
  if (types.includes("null")) return "null";

  return "unknown";
}

export function toTSStyleOneLine(schema: JsonSchema, colored = false): string {
  const c = colored
    ? { cyan, blue, yellow, green, dim }
    : { cyan: (s: string) => s, blue: (s: string) => s, yellow: (s: string) => s, green: (s: string) => s, dim: (s: string) => s };

  return toTSStyleOneLineInner(schema, c);
}

type ColorFns = {
  cyan: (s: string) => string;
  blue: (s: string) => string;
  yellow: (s: string) => string;
  green: (s: string) => string;
  dim: (s: string) => string;
};

function toTSStyleOneLineInner(schema: JsonSchema, c: ColorFns): string {
  if (schema.enum) {
    return schema.enum.map((val) => c.green(JSON.stringify(val))).join(c.dim(" | "));
  }

  if (schema.anyOf) {
    return schema.anyOf.map((s) => toTSStyleOneLineInner(s, c)).join(c.dim(" | "));
  }

  if (schema.oneOf) {
    return schema.oneOf.map((s) => toTSStyleOneLineInner(s, c)).join(c.dim(" | "));
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => toTSStyleOneLineInner(s, c)).join(c.dim(" & "));
  }

  const types = Array.isArray(schema.type) ? schema.type : [schema.type];

  if (types.includes("array") && schema.items) {
    return `${toTSStyleOneLineInner(schema.items, c)}${c.dim("[]")}`;
  }

  if (types.includes("object") && schema.properties) {
    const requiredSet = new Set(schema.required || []);
    const props: string[] = [];

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const optional = requiredSet.has(key) ? "" : c.yellow("?");
      const propType = toTSStyleOneLineInner(propSchema, c);
      props.push(`${c.cyan(key)}${optional}${c.dim(":")} ${propType}`);
    }

    return `${c.dim("{")} ${props.join(c.dim(", "))} ${c.dim("}")}`;
  }

  if (types.includes("string")) return c.blue("string");
  if (types.includes("number")) return c.blue("number");
  if (types.includes("integer")) return c.blue("number");
  if (types.includes("boolean")) return c.blue("boolean");
  if (types.includes("null")) return c.blue("null");

  return c.blue("unknown");
}
