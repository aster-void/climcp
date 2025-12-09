import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { ListRootsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { ChildProcess } from "node:child_process";
import { pathToFileURL } from "node:url";
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

function tryCreateTransport(
  target: string,
): { ok: true; transport: Transport } | { ok: false; error: string } {
  try {
    return { ok: true, transport: createTransport(target) };
  } catch (error) {
    return { ok: false, error: `Invalid target: ${getErrorMessage(error)}` };
  }
}

export async function createRunner(
  target: string,
  options: RunnerOptions = {},
): Promise<RunnerResult> {
  const transportResult = tryCreateTransport(target);
  if (!transportResult.ok) {
    return { ok: false, error: transportResult.error, phase: "transport" };
  }
  const transport = transportResult.transport;

  const client = new Client(
    {
      name: pkg.name || "climcp",
      version: pkg.version || "0.0.0",
    },
    {
      capabilities: {
        roots: {
          listChanged: false,
        },
      },
    },
  );

  client.setRequestHandler(ListRootsRequestSchema, () => {
    const cwd = process.cwd();
    return {
      roots: [
        {
          uri: pathToFileURL(cwd).href,
          name: cwd,
        },
      ],
    };
  });

  if (transport instanceof StdioClientTransport && transport.stderr) {
    if (options.onServerStderr) {
      transport.stderr.on("data", options.onServerStderr);
    }
  }

  const connectResult = await tryConnect(client, transport);
  if (!connectResult.ok) {
    await closeTransport(transport);
    return { ok: false, error: connectResult.error, phase: "connect" };
  }

  const shutdown = async (): Promise<void> => {
    await client.close();
    await closeTransport(transport);
  };

  return { ok: true, runner: { client, shutdown } };
}

async function tryConnect(
  client: Client,
  transport: Transport,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await client.connect(transport);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Failed to connect to server: ${getErrorMessage(error)}`,
    };
  }
}

async function closeTransport(transport: Transport): Promise<void> {
  if (transport instanceof StdioClientTransport) {
    killStdioProcess(transport);
  }
  await transport.close();
}
