# Agent Instructions

## Runtime and verification

- Keep the action container-free. Use Node.js 24 and keep `.nvmrc` aligned with the action runtime.
- Use pnpm at the version pinned in `package.json`. Commit `pnpm-lock.yaml` and use frozen-lockfile installs.
- Use `package.json` scripts through pnpm for development tasks. `pnpm run setup` installs macOS tooling, Node dependencies, and pre-commit hooks. Install Node.js and pnpm separately, not through the Brewfile.
- `pnpm test` runs offline behavior tests. `pnpm test:integration` runs the committed bundle against the official Renovate validator and requires npm registry access.
- `pnpm build` generates the distributable. Include `dist/` in changes that affect the runtime. Never hand-edit generated files.
- `pnpm lint` checks JavaScript syntax and actionlint. `pnpm format:check` verifies dprint formatting.
- `pnpm analyze` runs static checks and verifies bundle freshness. `pnpm check` also runs all tests. `pnpm hooks` runs all pre-commit checks.
- Keep GitHub log grouping, annotations, and the job summary in `src/index.js` using the Actions toolkit. Summary failures must not change validation results.
- Do not dump the environment, credentials, or arbitrary user files into logs.

## Workflows and validation

- Validate only the repository root's `renovate.json`. When absent, exit successfully before installing or invoking the validator.
- Use the official Renovate validator, pinned through its development dependency. Pass `--no-global` when specifying the repository config path. Do not migrate or rewrite the user's configuration.
- Run npm and Renovate outside the checkout with a neutral global configuration. Never load executable configuration or npm settings from an untrusted checkout.
- Test the action and its bundled entry point on both macOS and Linux.
- Source the CI Node version from `.nvmrc` using `node-version-file`.
- Pin external workflow actions to full commit SHAs and disable persisted checkout credentials. Keep normal workflow permissions read-only.
- Publishing must test the exact release commit before creating tags. Never replace full-version release tags.
- Prefer `actions/github-script` for GitHub API calls and workflow logic. Reserve shell for simple commands.
- Use `jq` for JSON and `yq` for YAML processing in shell.

## Compaction

After every compaction operation, read this file again before continuing.
