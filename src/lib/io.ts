import process from "node:process";
import readline from "node:readline";
import { ok, err, type Result } from "./result.ts";
import { getErrorMessage } from "./errors.ts";

export function askLine(rl: readline.Interface): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    rl.question("> ", (answer) => finish(answer));
    rl.once("close", () => finish(null));
  });
}

export async function tryReadStdin(): Promise<Result<string>> {
  try {
    const data = await readStdin();
    return ok(data);
  } catch (error) {
    return err(new Error(`Failed to read stdin: ${getErrorMessage(error)}`));
  }
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}
