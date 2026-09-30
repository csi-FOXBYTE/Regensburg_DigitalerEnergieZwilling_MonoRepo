import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("CLI runs when its entry point is invoked through a symlink", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "det-building-energy-profile-cli-"));
  const { NODE_TEST_CONTEXT: _nodeTestContext, ...env } = process.env;
  const entryPoint = fileURLToPath(
    new URL("../../src/bin/generate-det-building-energy-profile.ts", import.meta.url),
  );
  const linkedEntryPoint = join(tempDir, "generate-det-building-energy-profile.ts");

  try {
    await symlink(entryPoint, linkedEntryPoint);

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["--import", "tsx", linkedEntryPoint, "--help"],
      { env },
    );

    assert.match(stdout, /^Usage: generate-det-building-energy-profile/m);
    assert.equal(stderr, "");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
