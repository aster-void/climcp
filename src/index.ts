import { Command } from "commander";
import { EXIT_USAGE } from "./lib/constants.ts";
import { handleConnect } from "./cmd/connect.ts";
import { handleRun } from "./cmd/run.ts";

const program = new Command();
program
  .name("climcp")
  .description("Simple MCP connector CLI")
  .configureOutput({
    outputError: (str, write) => write(str),
  });

program
  .command("connect")
  .argument(
    "<target...>",
    "MCP server target: command args, http(s):// URL, or sse:// URL",
  )
  .action(async (target: string[]) => {
    await handleConnect(target.join(" "));
  });

program
  .command("run")
  .argument(
    "<target>",
    "MCP server target: command (quote if spaces), http(s):// URL, or sse:// URL",
  )
  .argument("[tool]", "Tool name to run (omit to list tools)")
  .argument("[args...]", "Tool arguments (key=value or JSON)")
  .action(async (target: string, tool: string | undefined, args: string[]) => {
    await handleRun(target, tool, args);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(EXIT_USAGE);
});
