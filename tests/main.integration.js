import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const entry = resolve("dist/index.js");

for (const { name, content, status, diagnostic } of [
  { name: "missing config skips", content: undefined, status: 0, diagnostic: /Skipping validation/ },
  { name: "valid repository config passes", content: "{}", status: 0, diagnostic: /Config validated successfully/ },
  { name: "malformed JSON fails", content: "{", status: 1, diagnostic: /File could not be parsed/ },
  {
    name: "unknown Renovate option fails",
    content: "{\"notARenovateOption\":true}",
    status: 1,
    diagnostic: /Found errors in configuration/,
  },
  {
    name: "global-only option fails repository validation",
    content: "{\"platform\":\"github\"}",
    status: 1,
    diagnostic: /Found errors in configuration/,
  },
]) {
  test(`bundled action: ${name}`, { timeout: 180_000 }, (t) => {
    const workspace = mkdtempSync(join(tmpdir(), "renovate-integration-"));
    t.after(() => rmSync(workspace, { recursive: true, force: true }));
    if (content !== undefined) writeFileSync(join(workspace, "renovate.json"), content);
    // A PR must not be able to execute a global config from its checkout.
    writeFileSync(join(workspace, "config.js"), "throw new Error(\"UNTRUSTED_CONFIG_EXECUTED\");");
    const output = join(workspace, "output");
    const summary = join(workspace, "summary");
    writeFileSync(output, "");
    writeFileSync(summary, "");
    const result = spawnSync(process.execPath, [entry], {
      cwd: workspace,
      env: {
        ...process.env,
        GITHUB_WORKSPACE: workspace,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: summary,
        RENOVATE_CONFIG_FILE: join(workspace, "config.js"),
      },
      encoding: "utf8",
      timeout: 170_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    assert.ifError(result.error);
    assert.equal(result.status, status, `${result.stdout}\n${result.stderr}`);
    assert.doesNotMatch(result.stdout + result.stderr, /UNTRUSTED_CONFIG_EXECUTED/);
    assert.match(result.stdout, diagnostic);
    if (content === undefined) {
      assert.match(readFileSync(output, "utf8"), /skipped[^]*true/);
    } else {
      assert.match(readFileSync(summary, "utf8"), status === 0 ? /passed/ : /failed/);
      assert.equal(readFileSync(join(workspace, "renovate.json"), "utf8"), content);
    }
  });
}
