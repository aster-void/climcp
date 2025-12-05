import process from "node:process";
import { EXIT_CONNECT, EXIT_TOOL, EXIT_USAGE } from "../lib/constants.ts";
import { readStdin } from "../lib/io.ts";
import { listTools, formatTool, validateToolName } from "../domain/tools.ts";
import { parsePayload } from "./parse.ts";
import { createRunner } from "../domain/runner.ts";
import { getErrorMessage } from "../lib/errors.ts";

export async function handleRun(
  target: string,
  toolName: string | undefined,
  args: string[],
): Promise<never> {
  const result = await createRunner(target, {
    onServerStderr: (chunk) => process.stderr.write(`[server] ${chunk}`),
  });

  if (!result.ok) {
    console.error(result.error);
    process.exit(result.phase === "transport" ? EXIT_USAGE : EXIT_CONNECT);
  }

  const { client, shutdown } = result.runner;

  const exit = async (code: number): Promise<never> => {
    await shutdown();
    process.exit(code);
  };

  let tools;
  try {
    tools = await listTools(client);
  } catch (error) {
    console.error(`Failed to list tools: ${getErrorMessage(error)}`);
    return exit(EXIT_CONNECT);
  }

  if (toolName === undefined) {
    tools.forEach((tool) => console.log(formatTool(tool)));
    return exit(0);
  }

  if (!validateToolName(tools, toolName)) {
    console.error(`Tool not found: ${toolName}`);
    return exit(EXIT_CONNECT);
  }

  let input: string;
  if (args.length > 0) {
    input = args.join(" ");
  } else {
    try {
      input = await readStdin();
    } catch (error) {
      console.error(`Failed to read stdin: ${getErrorMessage(error)}`);
      return exit(EXIT_USAGE);
    }
  }

  const payloadResult = parsePayload(input, true);
  if (!payloadResult.ok) {
    console.error(payloadResult.error.message);
    return exit(EXIT_USAGE);
  }

  try {
    const callResult = await client.callTool({
      name: toolName,
      arguments: payloadResult.value,
    });
    console.log(JSON.stringify(callResult, null, 2));
  } catch (error) {
    console.error(`Tool execution failed: ${getErrorMessage(error)}`);
    return exit(EXIT_TOOL);
  }

  return exit(0);
}
