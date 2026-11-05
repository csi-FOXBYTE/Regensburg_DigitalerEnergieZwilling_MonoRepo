import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { it } from "node:test";
import { Type } from "@sinclair/typebox";
import { createLogger } from "../lib/pino.js";
import { defineConfig, startServer } from "./index.js";

it("names only the invalid environment variables, never their values", async (t) => {
  const secret = "PRIVATE_USER_DATA_MARKER";
  const lines: string[] = [];
  const stream = new Writable({ write(chunk, _encoding, done) { lines.push(chunk.toString()); done(); } });
  const previous = { missing: process.env.TOAB_TEST_MISSING, invalid: process.env.TOAB_TEST_INVALID };
  Reflect.deleteProperty(process.env, "TOAB_TEST_MISSING");
  process.env.TOAB_TEST_INVALID = secret;
  const exit = t.mock.method(process, "exit", (code?: number) => { throw new Error(`exit ${code}`); });
  t.after(() => {
    exit.mock.restore();
    for (const [key, value] of [["TOAB_TEST_MISSING", previous.missing], ["TOAB_TEST_INVALID", previous.invalid]] as const) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  });

  const config = defineConfig({
    logger: createLogger({}, stream),
    env: Type.Object({
      TOAB_TEST_MISSING: Type.String(),
      TOAB_TEST_INVALID: Type.String({ pattern: "^[0-9]+$" }),
      TOAB_TEST_OPTIONAL: Type.Optional(Type.String()),
    }),
  });
  const getRegistries = () => assert.fail("must not start");
  await assert.rejects(startServer(getRegistries, async () => {}, config), /exit 1/);

  assert.doesNotMatch(lines.join(""), new RegExp(secret));
  assert.deepEqual(lines.map((line) => JSON.parse(line)).map(({ time: _time, ...record }) => record), [
    { level: 60, event: "env_invalid", variables: ["TOAB_TEST_INVALID", "TOAB_TEST_MISSING"] },
  ]);
});
