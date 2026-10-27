import assert from "node:assert/strict";
import { resolve } from "node:path";
import { it } from "node:test";
import { resolveConfig } from "@csi-foxbyte/fastify-toab";
import config from "../../fastify-toab.config.js";

// HARD-03: Swagger UI (/docs), the OpenAPI document and Bull Board (/bullMQ)
// are development tools; fastify-toab enables them only for NODE_ENV=development.
it("keeps development tools off and CORS restricted outside development", async (t) => {
  const previous = process.env.NODE_ENV;
  t.after(() => {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else process.env.NODE_ENV = previous;
  });

  const root = resolve(import.meta.dirname, "../..");
  for (const nodeEnv of ["production", "test", undefined]) {
    if (nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else process.env.NODE_ENV = nodeEnv;
    const { fastify } = await resolveConfig(config, root);
    assert.equal(fastify.swagger.enabled, false, `swagger (${nodeEnv})`);
    assert.equal(fastify.swaggerUi.enabled, false, `swaggerUi (${nodeEnv})`);
    assert.equal(fastify.bullBoard.enabled, false, `bullBoard (${nodeEnv})`);
    assert.equal(fastify.cors.enabled, true, `cors (${nodeEnv})`);
    assert.notEqual(fastify.cors.origin, true, `cors origin (${nodeEnv})`);
  }

  process.env.NODE_ENV = "development";
  const { fastify } = await resolveConfig(config, root);
  assert.equal(fastify.swaggerUi.enabled, true);
  assert.equal(fastify.bullBoard.enabled, true);
});
