# climcp

> [!IMPORTANT]
> **This project is archived.** Use [mcptools](https://github.com/f/mcptools) instead — it's a more feature-complete Go implementation with the same goals.

Speak to MCP servers directly. `climcp` is an interface between human and MCP servers.

```
[You] <-> [MCP]
```

## Why

- Explore: `connect` for exploration. see what a MCP server can do.
- CI: one-shot `run` for automation
- Debugging (roadmap): `with` for debugging MCP in your terminal. [not implemented yet]

## Install

```sh
bun add -g climcp
# or
npm install -g climcp
```

Requires Node.js 22+ and bun (for development).

## Commands

- `climcp connect <command...>` — start the MCP server process, handshake, drop into an interactive prompt.
- `climcp run "<command>" [tool] [args...]` — start the server, call one tool once, exit. Omit tool to list available tools.

### Connect

Interactive mode with REPL. Available commands:

- `/help`, `/h` — show help
- `/tools`, `/t` — list available tools
- `/quit`, `/q` — exit

Example:

```sh
$ climcp connect bunx @modelcontextprotocol/server-filesystem .
read_file: { path: string, tail?: number, head?: number }
Read the complete contents of a file as text.
...

> list_directory path=.
< result: { ... }

> /q
```

### Run

One-shot execution. Supports two input formats:

```sh
# Query style (key=value)
climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory path=.

# Quoted values supported
climcp run "..." some_tool message="hello world" name='John Doe'

# JSON style
climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory '{ "path": "." }'

# List available tools (omit tool name)
climcp run "bunx @modelcontextprotocol/server-filesystem ."

# stdin also works (JSON or query style)
echo '{ path: "." }' | climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory
echo "path=." | climcp run "bunx @modelcontextprotocol/server-filesystem ." list_directory
```

Format is auto-detected: `{` prefix means JSON5 (supports trailing commas, unquoted keys, comments), otherwise query style (shell-like quoting supported).

Success prints JSON to stdout; any failure writes to stderr and exits non-zero.

## Reference

for development, see <./DEVELOPMENT.md>
