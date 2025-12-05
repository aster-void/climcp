import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { ChildProcess } from "node:child_process";
import { createTransport } from "./transport.ts";
import { getErrorMessage } from "../lib/errors.ts";
import pkg from "../../package.json" with { type: "json" };

export interface McpRunner {
  client: Client;
  shutdown(): Promise<void>;
}

export interface RunnerOptions {
  onServerStderr?: (chunk: Buffer) => void;
}

export type RunnerResult =
  | { ok: true; runner: McpRunner }
  | { ok: false; error: string; phase: "transport" | "connect" };

function killStdioProcess(transport: StdioClientTransport): void {
  const proc = (transport as unknown as { _process?: ChildProcess })._process;
  if (proc && !proc.killed) {
    proc.kill("SIGTERM");
  }
}

export async function createRunner(
  target: string,
  options: RunnerOptions = {},
): Promise<RunnerResult> {
  let transport: Transport;
  try {
    transport = createTransport(target);
  } catch (error) {
    return {
      ok: false,
      error: `Invalid target: ${getErrorMessage(error)}`,
      phase: "transport",
    };
  }

  const client = new Client({
    name: pkg.name || "climcp",
    version: pkg.version || "0.0.0",
  });

  if (transport instanceof StdioClientTransport && transport.stderr) {
    if (options.onServerStderr) {
      transport.stderr.on("data", options.onServerStderr);
    }
  }

  try {
    await client.connect(transport);
  } catch (error) {
    await closeTransport(transport);
    return {
      ok: false,
      error: `Failed to connect to server: ${getErrorMessage(error)}`,
      phase: "connect",
    };
  }

  const shutdown = async (): Promise<void> => {
    await client.close();
    await closeTransport(transport);
  };

  return { ok: true, runner: { client, shutdown } };
}

async function closeTransport(transport: Transport): Promise<void> {
  if (transport instanceof StdioClientTransport) {
    killStdioProcess(transport);
  }
  await transport.close();
}
