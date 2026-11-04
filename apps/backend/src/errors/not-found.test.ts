import assert from "node:assert/strict";
import { it } from "node:test";
import Fastify from "fastify";
import { installNotFoundHandler } from "./not-found.js";

it("answers unknown routes without echoing the requested URL", async () => {
  const app = Fastify();
  installNotFoundHandler(app);
  const token = "SECRET_TOKEN_IN_PATH";
  const response = await app.inject(`/api/public/submissions/${token}/download?x=${token}`);
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { status: "NOT_FOUND", code: 404, message: "Not found" });
  assert.ok(!response.body.includes(token));
  await app.close();
});
