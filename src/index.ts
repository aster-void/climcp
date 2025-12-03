import { Command } from "commander";
import { EXIT_USAGE } from "./constants.js";
import { handleConnect } from "./cmd/connect.js";
import { handleRun } from "./cmd/run.js";

const program = new Command();
program
	.name("mcp-console")
	.description("Simple MCP connector CLI")
	.configureOutput({
		outputError: (str, write) => write(str),
	});

program
	.command("connect")
	.argument("<command...>", "Command to start the MCP server")
	.action(async (commandArgs) => {
		await handleConnect(commandArgs);
	});

program
	.command("run")
	.argument("<tool>", "Tool name to run")
	.argument("<command...>", "Command to start the MCP server")
	.action(async (tool, commandArgs) => {
		await handleRun(tool, commandArgs);
	});

program.parseAsync(process.argv).catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(EXIT_USAGE);
});
