import assert from "node:assert/strict";
import { describe, it } from "node:test";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { allowedCorsOrigins, createCorsOrigin } from "./cors.js";

const env = {
  PUBLIC_CLIENT_BASE_URL: "https://det.example/",
  ADMIN_CLIENT_BASE_URL: "https://admin.det.example/base",
};

describe("CORS allowlist", () => {
  it("allows exactly the public and admin client origins", () => {
    assert.deepEqual(allowedCorsOrigins(env), [
      "https://det.example",
      "https://admin.det.example",
    ]);
    assert.throws(
      () => allowedCorsOrigins({ ...env, ADMIN_CLIENT_BASE_URL: undefined }),
      /ADMIN_CLIENT_BASE_URL/,
    );
    assert.throws(
      () => allowedCorsOrigins({ ...env, PUBLIC_CLIENT_BASE_URL: "javascript:alert(1)" }),
      /HTTP or HTTPS/,
    );
  });

  it("adds only the explicitly configured extra origins", () => {
    assert.deepEqual(allowedCorsOrigins({ ...env, AUTH_CORS_ADDITIONAL_ORIGINS: "" }), [
      "https://det.example",
      "https://admin.det.example",
    ]);
    assert.deepEqual(
      allowedCorsOrigins({
        ...env,
        AUTH_CORS_ADDITIONAL_ORIGINS: " https://partner.example/app , http://localhost:4321,",
      }),
      ["https://det.example", "https://admin.det.example", "https://partner.example", "http://localhost:4321"],
    );
    for (const value of ["*", "partner.example", "ftp://partner.example"])
      assert.throws(
        () => allowedCorsOrigins({ ...env, AUTH_CORS_ADDITIONAL_ORIGINS: value }),
        /AUTH_CORS_ADDITIONAL_ORIGINS/,
      );
  });

  it("does not reflect foreign origins", async (t) => {
    const app = Fastify();
    await app.register(cors, { origin: createCorsOrigin(env) });
    app.get("/api/public/ping", async () => ({ ok: true }));
    await app.ready();
    t.after(() => app.close());

    const allowed = await app.inject({
      method: "OPTIONS",
      url: "/api/public/ping",
      headers: { origin: "https://det.example", "access-control-request-method": "GET" },
    });
    assert.equal(allowed.headers["access-control-allow-origin"], "https://det.example");

    for (const origin of [
      "https://evil.example",
      "null",
      "https://det.example.evil.com",
      "http://det.example",
    ]) {
      const response = await app.inject({
        method: "GET",
        url: "/api/public/ping",
        headers: { origin },
      });
      assert.equal(response.headers["access-control-allow-origin"], undefined, origin);
    }
  });
});
