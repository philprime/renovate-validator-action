import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import pkg from "../package.json" with { type: "json" };

async function summarize(message) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  try {
    await core.summary.addHeading("Renovate validation", 3).addRaw(message).write();
  } catch {
    core.warning("Unable to write the job summary. See the step logs for the result.");
  }
}

async function main() {
  const config = join(process.env.GITHUB_WORKSPACE || process.cwd(), "renovate.json");
  let info;
  try {
    info = await stat(config);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    core.setOutput("skipped", true);
    core.info("Skipping validation: no renovate.json found in the repository root.");
    return;
  }
  if (!info.isFile()) throw new Error("renovate.json must be a regular file.");

  core.setOutput("skipped", false);
  const directory = await mkdtemp(join(tmpdir(), "renovate-validator-"));
  try {
    // Isolate npm and Renovate from the checkout's .npmrc and executable config.js.
    const globalConfig = join(directory, "config.json");
    await writeFile(globalConfig, "{}");
    const exitCode = await core.group("Validate renovate.json", () =>
      exec("npx", [
        "--yes",
        `--package=renovate@${pkg.devDependencies.renovate}`,
        "--",
        "renovate-config-validator",
        "--no-global",
        config,
      ], {
        cwd: directory,
        env: {
          ...process.env,
          // JavaScript actions have their own Node runtime, independent of the runner's PATH.
          PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH || ""}`,
          RENOVATE_CONFIG_FILE: globalConfig,
        },
        ignoreReturnCode: true,
      }));
    if (exitCode !== 0) {
      core.setFailed(`Renovate validation failed (validator exit code ${exitCode}).`);
      await summarize("Validation failed. See the grouped step logs for details.");
      return;
    }
    core.info("renovate.json passed validation.");
    await summarize("renovate.json passed validation.");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

main().catch((error) => core.setFailed(error.message));
