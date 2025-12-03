import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { type Tool } from "@modelcontextprotocol/sdk/spec.types.js";
import {
	StdioClientTransport,
	type StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { EXIT_CONNECT, EXIT_USAGE } from "./constants.js";
import { toTSStyle, type JsonSchema } from "./lib/json-schema.js";
import pkg from "../package.json" with { type: "json" };

export type ToolInfo = Pick<Tool, "name" | "description" | "inputSchema">;

export function buildTransport(commandArgs: string[]) {
	if (!commandArgs || commandArgs.length === 0) {
		console.error("Error: <command...> is required to start an MCP server");
		process.exit(EXIT_USAGE);
	}
	const [command, ...args] = commandArgs;
	if (!command) {
		console.error("Error: <command...> is required to start an MCP server");
		process.exit(EXIT_USAGE);
	}
	const params: StdioServerParameters = {
		command,
		args,
		stderr: "pipe",
	};
	return new StdioClientTransport(params);
}

export async function connectClient(commandArgs: string[]) {
	const transport = buildTransport(commandArgs);
	const client = new Client({
		name: pkg.name || "mcp-console",
		version: pkg.version || "0.0.0",
	});

	if (transport.stderr) {
		transport.stderr.on("data", (chunk) => {
			process.stderr.write(`[server] ${chunk}`);
		});
	}

	try {
		await client.connect(transport);
	} catch (error) {
		console.error(
			`Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`,
		);
		await transport.close();
		process.exit(EXIT_CONNECT);
	}

	return { client, transport };
}

export async function listTools(client: Client): Promise<ToolInfo[]> {
	const response = await client.listTools();
	const tools = response.tools || [];
	tools.forEach((tool) => {
		const desc = tool.description ? `: ${tool.description}` : "";
		console.log(`- ${tool.name}${desc}`);
		const tsStyle = toTSStyle(tool.inputSchema as JsonSchema, 1);
		console.log("  expected schema:");
		tsStyle.split("\n").forEach((line) => console.log(`    ${line}`));
	});
	return tools.map((tool) => ({
		name: tool.name,
		description: tool.description,
		inputSchema: tool.inputSchema,
	}));
}

export function printCallResult(result: unknown) {
	if (result === undefined) {
		console.log("< result: null");
		return;
	}
	const formatted = JSON.stringify(result, null, 2);
	console.log(`< result: ${formatted}`);
}
