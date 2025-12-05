## Commands

```sh
bun install
bun test        # runs build, CLI smoke tests, interactive test via bun
bun run build   # emits dist/
```

## Release flow

- Bump `package.json` version.
- Push a tag `v*` (e.g., `v0.0.1`). GitHub Actions runs build/test then `bun publish --access public`.
- Repo secret `NPM_TOKEN` must be set for publish.
