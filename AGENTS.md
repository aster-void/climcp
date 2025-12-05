# AGENTS.md

Guidelines for agents working on this repository. Avoid destructive operations and behavioral ambiguity, prioritize explicit failures and simple procedures.
It may seem you are looking at CLAUDE.md, but this is AGENTS.md.

## Project Overview

- climcp built with bun. `climcp connect <command...>` starts and interacts with a server, `climcp run "tool" <command...>` executes once.
- Exit codes follow the policy described in README, clearly separating user errors from connection-related errors.

## Directory Structure

```
.
├─ src/
│  ├─ index.ts              # CLI entrypoint (minimal)
│  ├─ cmd/                   # UI layer (console.log, process.exit)
│  │  ├─ run.ts             # `climcp run` handler
│  │  ├─ connect.ts         # `climcp connect` handler
│  │  └─ parse.ts           # Input parsing (invocation, JSON5, query-style)
│  ├─ domain/                # Business logic (no I/O side effects)
│  │  ├─ runner.ts          # McpRunner interface & createRunner()
│  │  ├─ tools.ts           # Tool utilities (listTools, formatTool, validateToolName)
│  │  └─ transport.ts       # MCP Transport creation (Stdio, HTTP, SSE)
│  └─ lib/                   # Pure utilities (no dependencies on upper layers)
│     ├─ result.ts          # Result<T> type for error handling
│     ├─ errors.ts          # Error message formatting
│     ├─ io.ts              # I/O utilities (readline, stdin)
│     ├─ constants.ts       # Exit codes
│     ├─ json-schema.ts     # JSON Schema → TypeScript-style formatter
│     └─ colors.ts          # ANSI color utilities
├─ dist/                     # Built JS output
├─ scripts/                  # Development/verification scripts
└─ nix/                      # devshell and other Nix configs
```

## Dependency Graph

```
index.ts
├── lib/constants.ts
├── cmd/connect.ts
│   ├── domain/runner.ts → domain/transport.ts
│   ├── domain/tools.ts → lib/json-schema.ts → lib/colors.ts
│   ├── cmd/parse.ts → lib/result.ts
│   ├── lib/io.ts
│   ├── lib/constants.ts
│   └── lib/errors.ts
└── cmd/run.ts
    ├── domain/runner.ts → domain/transport.ts
    ├── domain/tools.ts → lib/json-schema.ts → lib/colors.ts
    ├── cmd/parse.ts → lib/result.ts
    ├── lib/io.ts
    ├── lib/constants.ts
    └── lib/errors.ts
```

### Layer Policy

- `cmd/*` → UI layer (console.log, process.exit, user input parsing)
- `domain/*` → Business logic (no I/O side effects)
- `lib/*` → Pure utilities (no dependencies on upper layers)

## Basic Flow

1. Build or operational verification
2. Find the bug cause and fix it
3. Build or operational verification

## Development Commands

```sh
bun run build # build the package
bun test      # run tests
bun check     # run type check + tests
```

## Command Tree

- `bun run build` → type-check + bundle + copy assets
- `bun test` → unit tests + CLI integration tests
- `bun check` → type-check + tests

## Nix / Flake Notes

- New files may not be visible to flake without `git add -N path`. Example: do `git add packages/foo.nix -N` before `nix run .#foo`.

## Coding/Change Policy

- Code should be self-explanatory, with only minimal necessary comments.
- Prioritize explicit arguments and error handling over implicit defaults.
- Don't break existing behavior or exit code policies.

## Repository-Specific Coding Guidelines

- Keep src/index.ts minimal.
- `as` and `any` are absolutely forbidden. Seriously, you'll get in trouble if you use them.
  - except for `as const` and `import * as foo from ...`. these are safe.
