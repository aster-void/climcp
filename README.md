# MCP Console

Speak MCP without writing glue code. `mcp-console` spins up your MCP server command, handshakes via `@modelcontextprotocol/sdk`, then lets you run tools interactively or in a one-shot flow.

## Why

- Stop yak-shaving: run MCP tools from any server command with zero boilerplate.
- Fits CI and REPL: one-shot `run` for automation, `connect` for exploration.
- Debugging: No more asking coding agents to run your MCPs.

## Install

```sh
bun add -g mcp-console
# or
npm install -g mcp-console
```

Requires Node.js 22+ and bun (for development).

## Commands

- `mcp-console connect <command...>` — start the MCP server process, handshake, drop into an interactive prompt.
- `mcp-console run "tool" <command...>` — start the server, call one tool once with JSON from stdin, exit.

### Connect

- On handshake success, lists exposed tools automatically (name, description, expected schema).
- Prompt:
  - `\t` — list tools (name, description, expected schema).
  - `<toolName> <json>` — call a tool with one-line JSON args; parse failure exits with error.
  - `\q` / `Ctrl+C` / `Ctrl+D` — quit and stop the server process.

Example:

```sh
$ mcp-console connect node examples/server.js
echo: Echos content
> echo {"text":"hello"}
result: {"text":"hello"}
> \q
```

### Run

One-shot execution; args come from stdin:

```sh
echo '{"text":"hi"}' | mcp-console run "echo" node examples/server.js
```

Success prints JSON to stdout; any failure writes to stderr and exits non-zero.

## Reference

for development, see <./DEVELOPMENT.md>
