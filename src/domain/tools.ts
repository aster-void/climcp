import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type Tool } from "@modelcontextprotocol/sdk/spec.types.js";
import { toTSStyleOneLine, parseJsonSchema } from "../lib/json-schema.ts";

export type ToolInfo = Pick<Tool, "name" | "description" | "inputSchema">;

export async function listTools(client: Client): Promise<ToolInfo[]> {
  const response = await client.listTools();
  const tools = response.tools || [];
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export function formatTool(tool: ToolInfo): string {
  const schema = parseJsonSchema(tool.inputSchema);
  const format = toTSStyleOneLine(schema, true);
  const header = `[${tool.name}]: ${format}`;
  if (tool.description) {
    return `${header}\n  ${tool.description}`;
  }
  return header;
}

export function validateToolName(tools: ToolInfo[], toolName: string): boolean {
  return tools.some((t) => t.name === toolName);
}

export function formatCallResult(result: unknown): string {
  if (result === undefined) {
    return "< result: null";
  }
  const formatted = JSON.stringify(result, null, 2);
  return `< result: ${formatted}`;
}
