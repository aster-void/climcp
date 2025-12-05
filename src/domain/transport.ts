import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

function detectType(target: string): "stdio" | "http" | "sse" {
  const lower = target.toLowerCase();
  if (
    lower.startsWith("sse://") ||
    lower.startsWith("sse+http://") ||
    lower.startsWith("sse+https://")
  ) {
    return "sse";
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return "http";
  }
  return "stdio";
}

function sseUrlToHttp(sseUrl: string): string {
  if (sseUrl.startsWith("sse+https://")) {
    return sseUrl.replace("sse+https://", "https://");
  }
  if (sseUrl.startsWith("sse+http://")) {
    return sseUrl.replace("sse+http://", "http://");
  }
  if (sseUrl.startsWith("sse://")) {
    return sseUrl.replace("sse://", "http://");
  }
  return sseUrl;
}

export function createTransport(target: string): Transport {
  switch (detectType(target)) {
    case "http":
      return new StreamableHTTPClientTransport(new URL(target));
    case "sse":
      return new SSEClientTransport(new URL(sseUrlToHttp(target)));
    case "stdio": {
      const args = target.split(/\s+/);
      const [command, ...commandArgs] = args;
      if (!command) {
        throw new Error("Command is required for stdio transport");
      }
      return new StdioClientTransport({
        command,
        args: commandArgs,
        stderr: "pipe",
      });
    }
  }
}
