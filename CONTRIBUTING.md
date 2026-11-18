# Contributing

## Setup

Install the Node.js version in [.nvmrc](.nvmrc) and the pnpm version pinned in [package.json](package.json).

On macOS, run:

```sh
pnpm run setup
```

This installs the [Brewfile](Brewfile) tools, locked Node dependencies, and pre-commit hooks. On Linux, install the Brewfile tools using your package manager, then run `pnpm install --frozen-lockfile` and `pnpm hooks:install`.

## Checks

Use the scripts in `package.json`:

| Command                 | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm build`            | Bundle the action and runtime dependencies into `dist/`.       |
| `pnpm format`           | Format JavaScript, JSON, Markdown, and YAML.                   |
| `pnpm lint`             | Check JavaScript syntax and workflow linting.                  |
| `pnpm test`             | Run offline action behavior tests.                             |
| `pnpm test:integration` | Test the bundled action with the real Renovate validator.      |
| `pnpm bundle:check`     | Verify the committed bundle matches the source.                |
| `pnpm analyze`          | Run static checks, formatting checks, and bundle verification. |
| `pnpm check`            | Run static checks and all tests.                               |
| `pnpm hooks`            | Run all pre-commit checks against tracked files.               |

Integration tests require npm registry access. They cover successful validation, absent configuration, malformed JSON, invalid options, repository-only validation, and isolation from executable checkout configuration.

For documentation-only changes, run `pnpm format:check`.

Pre-commit formats source files, then rebuilds the bundle when runtime source or dependency metadata changes. If it updates `dist/`, review and stage the generated files before retrying the commit. Hooks do not stage files automatically. CI independently checks that the committed bundle is current.

## Making changes

- Keep the action compatible with Node.js 24 on macOS and Linux. Use `.nvmrc` as CI's Node version source.
- Use the official Renovate validator rather than maintaining a separate schema validator.
- Skip absent `renovate.json` before installing or invoking Renovate. Never rewrite the caller's configuration.
- Run the validator outside the checkout with a neutral global configuration. Do not execute repository-supplied JavaScript configuration or interpolate paths into shell commands.
- Add behavior tests for runtime changes. Regenerate and include `dist/` with `pnpm build`.
- Keep dprint as the formatter and pre-commit as the hook runner. Do not format generated bundles or the pnpm lockfile.
- Do not log credentials or dump the environment. Report vulnerabilities through [Security](SECURITY.md), not public issues.

The runtime entry point is [`src/index.js`](src/index.js). CI tests the action and its bundle on macOS and Linux. See [Releases](docs/releases.md) for publishing and repository protection.
