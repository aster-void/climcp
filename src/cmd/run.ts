import process from "node:process";
import { EXIT_CONNECT, EXIT_TOOL, EXIT_USAGE } from "../lib/constants.ts";
import { tryReadStdin } from "../lib/io.ts";
import {
  listTools,
  callTool,
  formatTool,
  validateToolName,
  formatCallResult,
} from "../domain/tools.ts";
import { parsePayload, parseQueryStyleArgs } from "./parse.ts";
import { bootstrapRunner } from "./bootstrap.ts";
import type { Result } from "../lib/result.ts";

// CLI args are already split by shell, so use parseQueryStyleArgs directly.
// Only fall back to stdin + parsePayload when no args provided.
async function parseArgs(
  args: string[],
): Promise<Result<Record<string, unknown>>> {
  if (args.length > 0) {
    return parseQueryStyleArgs(args);
  }
  const inputResult = await tryReadStdin();
  if (!inputResult.ok) {
    return inputResult;
  }
  return parsePayload(inputResult.value, true);
}

export async function handleRun(
  target: string,
  toolName: string | undefined,
  args: string[],
): Promise<never> {
  const { client, shutdown } = await bootstrapRunner(target);

  const exit = async (code: number): Promise<never> => {
    await shutdown();
    process.exit(code);
  };

  const toolsResult = await listTools(client);
  if (!toolsResult.ok) {
    console.error(toolsResult.error.message);
    return exit(EXIT_CONNECT);
  }
  const tools = toolsResult.value;

  if (toolName === undefined) {
    tools.forEach((tool) => console.log(formatTool(tool)));
    return exit(0);
  }

  if (!validateToolName(tools, toolName)) {
    console.error(`Tool not found: ${toolName}`);
    return exit(EXIT_CONNECT);
  }

  const payloadResult = await parseArgs(args);
  if (!payloadResult.ok) {
    console.error(payloadResult.error.message);
    return exit(EXIT_USAGE);
  }

  const callResult = await callTool(client, toolName, payloadResult.value);
  if (!callResult.ok) {
    console.error(callResult.error.message);
    return exit(EXIT_TOOL);
  }

  console.log(formatCallResult(callResult.value));
  return exit(0);
}
