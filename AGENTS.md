# AGENTS.md

Guidelines for agents working on this repository. Avoid destructive operations and behavioral ambiguity, prioritize explicit failures and simple procedures.

## Project Overview

- MCP Console built with bun. `mcp-console connect <command...>` starts and interacts with a server, `mcp-console run "tool" <command...>` executes once.
- Exit codes follow the policy described in README, clearly separating user errors from connection-related errors.

## Directory Structure (directories only)

```
.
├─ src/      # TypeScript implementation
├─ dist/     # Built JS output
├─ bin/      # CLI wrapper placement
├─ scripts/  # Development/verification scripts
└─ nix/      # devshell and other Nix configs
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
bun install
bun run build
bun test
```

## Nix / Flake Notes

- New files may not be visible to flake without `git add -N path`. Example: do `git add packages/foo.nix -N` before `nix run .#foo`.

## Coding/Change Policy

- Code should be self-explanatory, with only minimal necessary comments.
- Prioritize explicit arguments and error handling over implicit defaults.
- Don't break existing behavior or exit code policies.

## Repository-Specific Coding Guidelines

- Keep src/index.ts minimal.
- `as` and `any` are absolutely forbidden. Seriously, you'll get in trouble if you use them.
