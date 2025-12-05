import { test, expect } from "bun:test";
import { spawn } from "node:child_process";

const SERVER_BIN = "node_modules/.bin/mcp-server-filesystem";

function connectAndQuit(timeoutMs = 10_000): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["src/index.ts", "connect", "bun", SERVER_BIN, "."], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout: string[] = [];

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (buf: Buffer) => {
      stdout.push(buf.toString());
      if (buf.toString().includes(">")) {
        child.stdin.write("/q\n");
      }
    });

    child.on("close", () => {
      clearTimeout(timer);
      resolve({ stdout: stdout.join("") });
    });
  });
}

test("connect starts and lists tools", async () => {
  const result = await connectAndQuit();
  expect(result.stdout).toContain("read_file");
});
