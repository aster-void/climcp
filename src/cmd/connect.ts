import readline from "node:readline";
import process from "node:process";
import { EXIT_CONNECT, EXIT_USAGE } from "../lib/constants.ts";
import { askLine } from "../lib/io.ts";
import {
  listTools,
  formatTool,
  formatCallResult,
  type ToolInfo,
} from "../domain/tools.ts";
import { parseInvocation, parseJson5Payload } from "./parse.ts";
import { createRunner } from "../domain/runner.ts";
import { getErrorMessage } from "../lib/errors.ts";

export async function handleConnect(target: string): Promise<never> {
  const result = await createRunner(target, {
    onServerStderr: (chunk) => process.stderr.write(`[server] ${chunk}`),
  });

  if (!result.ok) {
    console.error(result.error);
    process.exit(result.phase === "transport" ? EXIT_USAGE : EXIT_CONNECT);
  }

  const { client, shutdown } = result.runner;

  let tools: ToolInfo[];
  try {
    tools = await listTools(client);
    tools.forEach((tool) => console.log(formatTool(tool)));
  } catch (error) {
    console.error(`Failed to list tools: ${getErrorMessage(error)}`);
    await shutdown();
    process.exit(EXIT_CONNECT);
  }

  const toolNames = new Set(tools.map((t) => t.name));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let closing = false;
  const cleanup = async (code = 0): Promise<void> => {
    if (closing) return;
    closing = true;
    rl.close();
    await shutdown();
    process.exit(code);
  };

  rl.on("SIGINT", () => cleanup(0));
  rl.on("close", () => cleanup(0));

  while (true) {
    const line = await askLine(rl);
    if (line === null) {
      await cleanup(0);
      return process.exit(0);
    }

    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    switch (trimmed) {
      case "/q":
      case "/quit": {
        await cleanup(0);
        return process.exit(0);
      }
      case "/t":
      case "/tools": {
        try {
          const refreshedTools = await listTools(client);
          refreshedTools.forEach((tool) => console.log(formatTool(tool)));
        } catch (error) {
          console.error(`Failed to list tools: ${getErrorMessage(error)}`);
        }
        continue;
      }
      default:
        break;
    }

    const parsedInvocation = parseInvocation(trimmed);
    if (!parsedInvocation.ok) {
      console.error(parsedInvocation.error.message);
      continue;
    }

    if (!toolNames.has(parsedInvocation.value.toolName)) {
      console.error(`Tool not found: ${parsedInvocation.value.toolName}`);
      continue;
    }

    const payloadResult = parseJson5Payload(
      parsedInvocation.value.payloadText,
      true,
    );
    if (!payloadResult.ok) {
      console.error(payloadResult.error.message);
      continue;
    }

    try {
      const callResult = await client.callTool({
        name: parsedInvocation.value.toolName,
        arguments: payloadResult.value,
      });
      console.log(formatCallResult(callResult));
    } catch (error) {
      console.error(`Tool call failed: ${getErrorMessage(error)}`);
    }
  }
}
