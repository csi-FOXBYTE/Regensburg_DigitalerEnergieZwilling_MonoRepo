import assert from "node:assert/strict";
import { resolve } from "node:path";
import { it } from "node:test";
import { resolveConfig } from "@csi-foxbyte/fastify-toab";
import config from "../../fastify-toab.config.js";

type OriginCheck = (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => void;

// Asks the configured origin check instead of comparing it with `true`, so
// "*", a catch-all RegExp or an allow-all callback fail as well.
const allowsOrigin = (origin: unknown, requestOrigin: string) => {
  let allowed: boolean | undefined;
  (origin as OriginCheck)(requestOrigin, (error, allow) => {
    if (error) throw error;
    allowed = allow;
  });
  return allowed;
};

// HARD-03: Swagger UI (/docs), the OpenAPI document and Bull Board (/bullMQ)
// are development tools; fastify-toab enables them only for NODE_ENV=development.
it("keeps development tools off and CORS restricted outside development", async (t) => {
  const keys = ["NODE_ENV", "PUBLIC_CLIENT_BASE_URL", "ADMIN_CLIENT_BASE_URL", "AUTH_CORS_ADDITIONAL_ORIGINS"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  });
  process.env.PUBLIC_CLIENT_BASE_URL = "https://det.example";
  process.env.ADMIN_CLIENT_BASE_URL = "https://admin.det.example";
  Reflect.deleteProperty(process.env, "AUTH_CORS_ADDITIONAL_ORIGINS");

  const root = resolve(import.meta.dirname, "../..");
  for (const nodeEnv of ["production", "test", undefined]) {
    if (nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else process.env.NODE_ENV = nodeEnv;
    const { fastify } = await resolveConfig(config, root);
    assert.equal(fastify.swagger.enabled, false, `swagger (${nodeEnv})`);
    assert.equal(fastify.swaggerUi.enabled, false, `swaggerUi (${nodeEnv})`);
    assert.equal(fastify.bullBoard.enabled, false, `bullBoard (${nodeEnv})`);
    assert.equal(fastify.cors.enabled, true, `cors (${nodeEnv})`);
    // A non-function origin ("*", true, a RegExp or a list) is never accepted here.
    assert.equal(typeof fastify.cors.origin, "function", `cors origin (${nodeEnv})`);
    assert.equal(allowsOrigin(fastify.cors.origin, "https://evil.example"), false, `foreign origin (${nodeEnv})`);
    assert.equal(allowsOrigin(fastify.cors.origin, "https://det.example"), true, `client origin (${nodeEnv})`);
  }

  process.env.NODE_ENV = "development";
  const { fastify } = await resolveConfig(config, root);
  assert.equal(fastify.swaggerUi.enabled, true);
  assert.equal(fastify.bullBoard.enabled, true);
});
