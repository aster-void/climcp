import readline from "node:readline";
import process from "node:process";
import { EXIT_CONNECT } from "../lib/constants.ts";
import { askLine } from "../lib/io.ts";
import {
  listTools,
  callTool,
  formatTool,
  formatCallResult,
} from "../domain/tools.ts";
import { parseInvocation, parsePayload } from "./parse.ts";
import { bootstrapRunner } from "./bootstrap.ts";

export async function handleConnect(target: string): Promise<never> {
  const { client, shutdown } = await bootstrapRunner(target);

  const toolsResult = await listTools(client);
  if (!toolsResult.ok) {
    console.error(toolsResult.error.message);
    await shutdown();
    process.exit(EXIT_CONNECT);
  }
  const tools = toolsResult.value;
  tools.forEach((tool) => console.log(formatTool(tool)));
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
        const refreshedResult = await listTools(client);
        if (refreshedResult.ok) {
          refreshedResult.value.forEach((tool) =>
            console.log(formatTool(tool)),
          );
        } else {
          console.error(refreshedResult.error.message);
        }
        continue;
      }
      case "/h":
      case "/help": {
        console.log(`Commands:
  /help, /h     Show this help
  /tools, /t    List available tools
  /quit, /q     Exit

Usage:
  <tool> <args>           Call a tool with arguments
  <tool> key=value ...    Query-style arguments
  <tool> {"key": "value"} JSON5 arguments`);
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

    const payloadResult = parsePayload(
      parsedInvocation.value.payloadText,
      true,
    );
    if (!payloadResult.ok) {
      console.error(payloadResult.error.message);
      continue;
    }

    const callResult = await callTool(
      client,
      parsedInvocation.value.toolName,
      payloadResult.value,
    );
    if (callResult.ok) {
      console.log(formatCallResult(callResult.value));
    } else {
      console.error(callResult.error.message);
    }
  }
}
