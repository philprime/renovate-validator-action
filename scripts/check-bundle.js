import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "renovate-bundle-"));
try {
  execFileSync("pnpm", ["build", "--out", directory], { stdio: "inherit" });
  const files = readdirSync(directory).sort();
  assert.deepEqual(readdirSync("dist").sort(), files, "Run pnpm build and include all generated files.");
  for (const file of files) {
    if (!readFileSync(join("dist", file)).equals(readFileSync(join(directory, file)))) {
      throw new Error(`dist/${file} is stale. Run pnpm build and include the generated files.`);
    }
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
