import assert from "node:assert/strict";
import test from "node:test";

import { build } from "esbuild";

test("the root entrypoint can be bundled for browsers", async () => {
  const result = await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "esm",
    platform: "browser",
    write: false,
  });

  assert.ok(result.outputFiles.length > 0);
});
