import { describe, test, expect } from "bun:test";
import { toTSStyle, type JsonSchema } from "./json-schema.ts";

describe("toTSStyle", () => {
	test("simple string property", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				text: { type: "string" },
			},
			required: ["text"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  text: string;
}`;
		expect(result).toBe(expected);
	});

	test("optional property", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				text: { type: "string" },
				count: { type: "number" },
			},
			required: ["text"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  text: string;
  count?: number;
}`;
		expect(result).toBe(expected);
	});

	test("property with description", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				path: {
					type: "string",
					description: "The file path",
				},
			},
			required: ["path"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  path: string; // The file path
}`;
		expect(result).toBe(expected);
	});

	test("nested object", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				config: {
					type: "object",
					properties: {
						enabled: { type: "boolean" },
					},
					required: ["enabled"],
				},
			},
			required: ["config"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  config: {
    enabled: boolean;
  };
}`;
		expect(result).toBe(expected);
	});

	test("array type", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				items: {
					type: "array",
					items: { type: "string" },
				},
			},
			required: ["items"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  items: string[];
}`;
		expect(result).toBe(expected);
	});

	test("enum type", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				status: {
					enum: ["active", "inactive", "pending"],
				},
			},
			required: ["status"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  status: "active" | "inactive" | "pending";
}`;
		expect(result).toBe(expected);
	});

	test("union type with anyOf", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				value: {
					anyOf: [{ type: "string" }, { type: "number" }],
				},
			},
			required: ["value"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  value: string | number;
}`;
		expect(result).toBe(expected);
	});

	test("mixed types", () => {
		const schema: JsonSchema = {
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "integer" },
				active: { type: "boolean" },
				data: { type: "null" },
			},
			required: ["name", "age"],
		};
		const result = toTSStyle(schema, 0);
		const expected = `{
  name: string;
  age: number;
  active?: boolean;
  data?: null;
}`;
		expect(result).toBe(expected);
	});
});
