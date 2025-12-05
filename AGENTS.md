# AGENTS.md

Guidelines for agents working on this repository. Avoid destructive operations and behavioral ambiguity, prioritize explicit failures and simple procedures.

## Project Overview

- climcp built with bun. `climcp connect <command...>` starts and interacts with a server, `climcp run "tool" <command...>` executes once.
- Exit codes follow the policy described in README, clearly separating user errors from connection-related errors.

## Directory Structure

```
.
├─ src/
│  ├─ index.ts          # CLI entrypoint (minimal)
│  ├─ runner.ts         # McpRunner interface & createRunner()
│  ├─ mcp.ts            # Tool utilities (listTools, printCallResult)
│  ├─ transport/
│  │  ├─ index.ts       # createTransport() & type detection
│  │  ├─ types.ts       # TransportConfig, TransportType
│  │  ├─ stdio.ts       # stdio transport
│  │  ├─ http.ts        # Streamable HTTP transport
│  │  └─ sse.ts         # SSE transport (deprecated)
│  ├─ cmd/
│  │  ├─ run.ts         # `climcp run` handler
│  │  └─ connect.ts     # `climcp connect` handler
│  └─ lib/
│     ├─ json-schema.ts # JSON Schema → TypeScript-style formatter
│     └─ colors.ts      # ANSI color utilities
├─ dist/                # Built JS output
├─ scripts/             # Development/verification scripts
└─ nix/                 # devshell and other Nix configs
```

## Top Priority Principles

- Make failures explicit: Don't suppress errors. Don't silence with `|| true`. Avoid suppression with `if pkgs ? foo`.
- Plan before working: Proceed in order: investigation → plan presentation → approval.
- Confirm before destructive operations: Obtain y/n approval before execution (exception only when user instruction contains `--yes`).
- Fix one cause at a time: Identify the cause, resolve one issue at a time, and re-execute.
- Don't detour: If the initial plan fails, present the next plan and obtain confirmation before proceeding.

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
