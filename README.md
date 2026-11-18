# Renovate validator

Validate a repository's root-level `renovate.json` with [Renovate's official configuration validator](https://docs.renovatebot.com/config-validation/).

- If `renovate.json` exists, validate it as repository configuration and fail on validation warnings or errors.
- If it is absent, exit successfully without downloading or running Renovate.
- Show validator diagnostics in grouped logs and write the validation result to the job summary.

The action uses Node.js 24 without containers and works on macOS and Linux. It does not modify the configuration. Migrations are reported using Renovate's default behavior, without strict-mode failures.

## Usage

Check out your repository before running the action:

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
    with:
      persist-credentials: false

  - name: Validate Renovate configuration
    id: renovate
    uses: philprime/renovate-validator-action@v1
    timeout-minutes: 5
```

No inputs or GitHub token are required for local configuration validation. The action checks only `renovate.json` in the checkout root, not alternative filenames or nested configurations. An absent configuration is a successful no-op, not a GitHub step with a `skipped` conclusion.

### Outputs

| Output    | Description                                               |
| --------- | --------------------------------------------------------- |
| `skipped` | `true` when `renovate.json` is absent, otherwise `false`. |

## Runner requirements

Use a runner that supports Node.js 24 actions and has npm available. Standard GitHub-hosted macOS and Linux runners meet these requirements. No `setup-node` step is needed for consumers.

When a configuration is present, the action uses `npx` to obtain the exact Renovate version pinned in [package.json](package.json). npm registry access is required. Validation runs outside the checkout with a neutral global configuration, preventing repository `.npmrc` and executable `config.js` files from being loaded.

## Development

See [Contributing](CONTRIBUTING.md) for pnpm scripts, [Security](SECURITY.md) for security considerations, and [Releases](docs/releases.md) for publishing.

## License

See [LICENSE](LICENSE).
