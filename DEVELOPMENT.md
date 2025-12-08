## Commands

```sh
bun install
bun test        # runs build, CLI smoke tests, interactive test via bun
bun run build   # emits dist/
```

## Release flow

- `npm version patch`
- `git push && git push --tags`
- Go to GitHub and create a new release
