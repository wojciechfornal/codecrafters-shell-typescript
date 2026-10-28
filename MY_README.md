# Formatting code

```shell
pnpm format
```

# Debugging

Bun for Visual Studio Code

```shell
bun --inspect --watch app/main.ts
```

# Troubleshooting submission

`error: lockfile had changes, but lockfile is frozen`, `Error: process "/bin/sh -c bun install --frozen-lockfile" did not complete successfully: exit code: 1.` and stuff like that.

It happens when new dependencies are added, other manifests and lock files are updated (eg. `package.json` and `package-lock.json`) but not `bun.lock`.

Just run `bun install` and then `codecrafters submit` again.
