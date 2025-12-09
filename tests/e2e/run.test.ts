import { test, expect } from "bun:test";
import { $ } from "bun";

const SERVER = "bun node_modules/.bin/mcp-server-filesystem .";

test("run without tool lists tools", async () => {
  const result = await $`bun src/index.ts run ${SERVER}`.quiet().nothrow();
  expect(result.exitCode).toBe(0);
  const stdout = result.stdout.toString();
  expect(stdout).toContain("list_directory");
  expect(stdout).toContain("read_file");
});

test("run calls tool and returns result", async () => {
  const result = await $`bun src/index.ts run ${SERVER} list_directory path=.`
    .quiet()
    .nothrow();
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain("[FILE]");
});

test("run with unknown tool fails", async () => {
  const result = await $`bun src/index.ts run ${SERVER} unknown_tool`
    .quiet()
    .nothrow();
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain("Tool not found: unknown_tool");
});

test("run handles args with spaces", async () => {
  // Create a temp directory with space in name
  const tempDir = "test dir with spaces";
  await $`mkdir -p ${tempDir}`.quiet();
  try {
    const result =
      await $`bun src/index.ts run ${SERVER} list_directory path=${tempDir}`
        .quiet()
        .nothrow();
    expect(result.exitCode).toBe(0);
  } finally {
    await $`rmdir ${tempDir}`.quiet();
  }
});
