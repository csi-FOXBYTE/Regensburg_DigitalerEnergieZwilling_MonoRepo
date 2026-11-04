import assert from "node:assert/strict";
import { connect } from "node:net";
import { describe, it } from "node:test";
import Fastify from "fastify";
import submissionsAdminController from "../submissionsAdmin/submissionsAdmin.controller.js";
import { createGuardedTestApp } from "../lib/guarded-test-app.js";
import { installFrameworkErrorHandlers, toFrameworkAppError } from "./framework-errors.js";

const service = {
  verifyRequest: async () => ({
    sub: "admin-1",
    resource_access: { "digital-energy-twin": { roles: ["admin"] } },
  }),
  user: { upsert: async () => ({ id: "admin-1" }) },
  getById: async () => {
    throw new Error("Rejected requests must not reach the handler");
  },
};

const marker = "SECRET_PATH_MARKER";

describe("framework error handlers", () => {
  it("answers an over-long path parameter with 414 in the AppError shape without the path", async (t) => {
    const app = await createGuardedTestApp([submissionsAdminController], service);
    t.after(() => app.close());

    const response = await app.inject({
      url: `/api/admin/submissions/${marker}${"a".repeat(100)}`,
      headers: { authorization: "Bearer x" },
    });

    assert.equal(response.statusCode, 414);
    assert.match(String(response.headers["content-type"]), /^application\/json/);
    assert.deepEqual(response.json(), { status: "URI_TOO_LONG", code: 414, message: "URI too long" });
    assert.ok(!response.body.includes(marker));
  });

  it("answers a malformed percent escape with 400 in the AppError shape without the path", async (t) => {
    const app = await createGuardedTestApp([submissionsAdminController], service);
    t.after(() => app.close());

    const response = await app.inject({
      url: `/api/admin/submissions/${marker}%E0%A4%A`,
      headers: { authorization: "Bearer x" },
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { status: "BAD_REQUEST", code: 400, message: "Bad request" });
    assert.ok(!response.body.includes(marker));
  });

  it("answers HTTP parser errors on the socket in the AppError shape", async (t) => {
    const app = Fastify();
    installFrameworkErrorHandlers(app);
    app.get("/", async () => ({ ok: true }));
    await app.listen({ host: "127.0.0.1", port: 0 });
    t.after(() => app.close());
    const { port } = app.server.address() as { port: number };

    const send = (request: string) =>
      new Promise<string>((resolve, reject) => {
        const socket = connect(port, "127.0.0.1", () => socket.end(request));
        let data = "";
        socket.on("data", (chunk) => { data += chunk.toString(); });
        socket.on("close", () => resolve(data));
        socket.on("error", reject);
      });

    const tooLarge = await send(`GET /${marker} HTTP/1.1\r\nHost: x\r\nX-Big: ${"a".repeat(20_000)}\r\n\r\n`);
    assert.match(tooLarge, /^HTTP\/1\.1 431 /);
    assert.deepEqual(JSON.parse(tooLarge.split("\r\n\r\n")[1]), {
      status: "REQUEST_HEADER_FIELDS_TOO_LARGE",
      code: 431,
      message: "Request header fields too large",
    });

    const malformed = await send(`GET /${marker} HTTP/1.1\r\nHost x\r\n\r\n`);
    assert.match(malformed, /^HTTP\/1\.1 400 /);
    assert.deepEqual(JSON.parse(malformed.split("\r\n\r\n")[1]), { status: "BAD_REQUEST", code: 400, message: "Bad request" });
    assert.ok(!tooLarge.includes(marker) && !malformed.includes(marker));
  });

  it("never passes a router error message to the client", () => {
    assert.deepEqual(toFrameworkAppError(500).toResponse(false), {
      status: "INTERNAL_ERROR",
      code: 500,
      message: "Internal server error",
    });
    assert.deepEqual(toFrameworkAppError(undefined).code, 500);
    assert.deepEqual(toFrameworkAppError(418).toResponse(false), { status: "BAD_REQUEST", code: 418, message: "Bad request" });
  });
});
