import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type Tool } from "@modelcontextprotocol/sdk/spec.types.js";
import { toTSStyleOneLine, parseJsonSchema } from "./lib/json-schema.ts";

export type ToolInfo = Pick<Tool, "name" | "description" | "inputSchema">;

export async function listTools(client: Client): Promise<ToolInfo[]> {
  const response = await client.listTools();
  const tools = response.tools || [];
  tools.forEach((tool) => {
    const schema = parseJsonSchema(tool.inputSchema);
    const format = toTSStyleOneLine(schema, true);
    console.log(`[${tool.name}]: ${format}`);
    if (tool.description) {
      console.log(`  ${tool.description}`);
    }
  });
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export function printCallResult(result: unknown) {
  if (result === undefined) {
    console.log("< result: null");
    return;
  }
  const formatted = JSON.stringify(result, null, 2);
  console.log(`< result: ${formatted}`);
}
