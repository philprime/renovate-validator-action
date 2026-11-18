# Security

## Reporting vulnerabilities

Report suspected vulnerabilities privately through the repository's **Security → Report a vulnerability** feature. Do not disclose credentials, exploitable details, or sensitive diagnostic logs in a public issue. If private reporting is unavailable, ask the maintainer to enable it without including vulnerability details.

## Supported versions

Security fixes target the latest stable major version. Use its latest patch release, or the corresponding full commit SHA. Older major versions do not have a guaranteed maintenance period.

## Validation and logs

The action validates the repository root's `renovate.json` without modifying it. It does not require a GitHub token, dump the environment, or upload artifacts. Renovate's diagnostics can include configuration values and filesystem paths. Do not put credentials in Renovate configuration, and review workflow log visibility on sensitive runners.

The official validator is obtained through npm at the exact Renovate version pinned in `package.json`. npm resolves that release's transitive dependencies at runtime. Network access and trust in the npm supply chain are required when configuration is present. Repositories without `renovate.json` do not invoke npm or Renovate.

Validation runs in a temporary directory with a neutral global configuration so repository `.npmrc` and executable `config.js` files are not loaded. The configuration path is passed as an argument, not interpolated into a shell command. Use trusted workflow definitions and GitHub Actions' native `timeout-minutes` setting to limit execution time.

## Release integrity

Full-version tags identify fixed releases. Major-version compatibility aliases are intentionally movable. Consumers requiring immutable references should pin the full release commit SHA and arrange dependency updates.

The release workflow tests its exact commit and never replaces an existing full-version tag. Repository administrators must enable immutable releases and configure branch/tag protection. Private vulnerability reporting and these protection settings are managed on GitHub, not by the action.
