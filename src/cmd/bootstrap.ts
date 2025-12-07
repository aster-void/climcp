import process from "node:process";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { EXIT_CONNECT, EXIT_USAGE } from "../lib/constants.ts";
import { createRunner } from "../domain/runner.ts";

export type Runner = {
  client: Client;
  shutdown: () => Promise<void>;
};

export async function bootstrapRunner(target: string): Promise<Runner> {
  const result = await createRunner(target, {
    onServerStderr: (chunk) => process.stderr.write(`[server] ${chunk}`),
  });

  if (!result.ok) {
    console.error(result.error);
    process.exit(result.phase === "transport" ? EXIT_USAGE : EXIT_CONNECT);
  }

  return result.runner;
}
