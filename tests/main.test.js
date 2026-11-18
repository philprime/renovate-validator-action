import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { test } from "node:test";

const entry = resolve("src/index.js");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "renovate-action-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const workspace = join(root, "repository with spaces; literal");
  const bin = join(root, "bin");
  mkdirSync(workspace);
  mkdirSync(bin);
  const invocation = join(root, "invocation.json");
  writeFileSync(
    join(bin, "npx"),
    `#!${process.execPath}
const fs = require('node:fs');
fs.writeFileSync(process.env.TEST_INVOCATION, JSON.stringify({
  args: process.argv.slice(2),
  cwd: process.cwd(),
  configFile: fs.realpathSync(process.env.RENOVATE_CONFIG_FILE),
  path: process.env.PATH,
}));
console.log('validator diagnostic output');
process.exit(Number(process.env.TEST_VALIDATOR_EXIT || 0));
`,
    { mode: 0o755 },
  );
  const output = join(root, "output");
  const summary = join(root, "summary");
  writeFileSync(output, "");
  writeFileSync(summary, "");
  return {
    root,
    workspace,
    invocation,
    output,
    summary,
    run(env = {}) {
      return spawnSync(process.execPath, [entry], {
        cwd: root,
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH}`,
          GITHUB_WORKSPACE: workspace,
          GITHUB_OUTPUT: output,
          GITHUB_STEP_SUMMARY: summary,
          TEST_INVOCATION: invocation,
          ...env,
        },
        encoding: "utf8",
      });
    },
  };
}

test("missing renovate.json succeeds without downloading or running Renovate", (t) => {
  const f = fixture(t);
  // Other Renovate locations are outside this action's contract.
  writeFileSync(join(f.workspace, ".renovaterc.json"), "{}");
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Skipping.*renovate\.json/i);
  assert.match(readFileSync(f.output, "utf8"), /skipped[^]*true/);
  assert.throws(() => readFileSync(f.invocation), { code: "ENOENT" });
});

test("valid config runs the pinned official repository validator and reports success", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.workspace, "renovate.json"), "{}");
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validator diagnostic output/);
  const invocation = JSON.parse(readFileSync(f.invocation, "utf8"));
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(invocation.args, [
    "--yes",
    `--package=renovate@${pkg.devDependencies.renovate}`,
    "--",
    "renovate-config-validator",
    "--no-global",
    join(f.workspace, "renovate.json"),
  ]);
  assert.notEqual(invocation.cwd, f.workspace);
  assert.equal(dirname(invocation.configFile), invocation.cwd);
  assert.equal(invocation.path.split(delimiter)[0], dirname(process.execPath));
  assert.match(readFileSync(f.output, "utf8"), /skipped[^]*false/);
  assert.match(readFileSync(f.summary, "utf8"), /passed/i);
});

test("validation failure fails the action and keeps validator diagnostics visible", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.workspace, "renovate.json"), "{}");
  const result = f.run({ TEST_VALIDATOR_EXIT: "42" });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /validator diagnostic output/);
  assert.match(result.stdout, /::error::/);
  assert.match(readFileSync(f.summary, "utf8"), /failed/i);
});

test("a directory named renovate.json fails instead of silently skipping", (t) => {
  const f = fixture(t);
  mkdirSync(join(f.workspace, "renovate.json"));
  const result = f.run();
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /::error::/);
});

test("an unavailable summary cannot turn successful validation into failure", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.workspace, "renovate.json"), "{}");
  const result = f.run({ GITHUB_STEP_SUMMARY: join(f.root, "missing", "summary") });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::warning::/);
});
