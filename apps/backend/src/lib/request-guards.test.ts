import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import pg from "pg";
import { toDatabaseAppError } from "../errors/database-error.js";
import feedbackAdminController from "../feedbackAdmin/feedbackAdmin.controller.js";
import feedbackPublicController from "../feedbackPublic/feedbackPublic.controller.js";
import submissionsAdminController from "../submissionsAdmin/submissionsAdmin.controller.js";
import submissionsPublicController from "../submissionsPublic/submissionsPublic.controller.js";
import { validSubmission } from "../submissions/submission-input.fixture.js";
import { schema } from "../zenstack/schema.js";
import { createGuardedTestApp } from "./guarded-test-app.js";
import { findViolation, hasNonUtf8JsonCharset, MAX_BODY_DEPTH } from "./request-guards.js";

const receipt = {
  version: 1,
  auditEventId: "11111111-1111-4111-8111-111111111111",
  deletedAt: "2026-09-17T12:00:00.000Z",
  action: "SUBMISSION_DELETE",
  actorType: "PUBLIC_CAPABILITY",
  targetType: "SUBMISSION",
  targetId: "submission-1",
  deletedCount: 1,
  verificationSecret: "a".repeat(43),
};

const createService = (failure?: unknown) => ({
  verifyRequest: async () => ({
    sub: "admin-1",
    resource_access: { "digital-energy-twin": { roles: ["admin"] } },
  }),
  user: { upsert: async () => ({ id: "admin-1" }) },
  list: mock.fn(async () => ({ data: [], total: 0 })),
  create: mock.fn(async (_input: unknown) => undefined),
  submit: mock.fn(async () => {
    if (failure) throw failure;
    return { deletionToken: "opaque-token" };
  }),
  verifyDeletionReceipt: mock.fn(async () => false),
});

const createApp = async (failure?: unknown) => {
  const service = createService(failure);
  const app = await createGuardedTestApp(
    [submissionsPublicController, feedbackPublicController, submissionsAdminController, feedbackAdminController],
    service,
  );
  return { app, service };
};

const nested = (depth: number) => "[".repeat(depth) + "]".repeat(depth);

// Runs the real ZenStack error wrapping against a pool that fails every write.
async function ormError(operation: "insert" | "delete", code?: string) {
  const pool = {
    async connect() {
      return {
        async query(sql: string | { text: string }) {
          const text = typeof sql === "string" ? sql : sql.text;
          if (code && /^\s*(insert|delete)/i.test(text))
            throw Object.assign(new Error("driver detail"), { code });
          return { rows: [], rowCount: 0 };
        },
        release() {}, on() {}, removeListener() {},
      };
    },
    async end() {},
  };
  const db = new ZenStackClient(schema, { dialect: new PostgresDialect({ pool: pool as never }) });
  try {
    if (operation === "insert")
      await db.feedback.create({ data: { category: "bug", message: "m" } });
    else await db.feedback.delete({ where: { id: "gone" } });
    assert.fail("Expected the synthetic query to fail");
  } catch (error) {
    return error;
  } finally {
    await db.$disconnect();
  }
}

describe("request guards", () => {
  it("rejects NUL characters in bodies, keys, query strings and path parameters with 400", async (t) => {
    const { app, service } = await createApp();
    t.after(() => app.close());

    const requests = [
      { method: "POST" as const, url: "/api/public/feedback", payload: { category: "bug", message: "a\u0000b" } },
      { method: "POST" as const, url: "/api/public/submissions", payload: { ...validSubmission(), address: "Domplatz\u00001" } },
      { method: "POST" as const, url: "/api/public/submissions", payload: { ...validSubmission(), "a\u0000": 1 } },
      { method: "GET" as const, url: "/api/admin/submissions?managerId=a%00b" },
      { method: "GET" as const, url: "/api/admin/submissions/a%00b" },
    ];
    for (const request of requests) {
      const response = await app.inject(request);
      assert.equal(response.statusCode, 400, `${request.url}: ${response.body}`);
      // The generic ERROR_400 response schema has no `code`.
      assert.deepEqual(response.json(), {
        status: "BAD_REQUEST",
        message: "Request must not contain NUL characters",
      });
    }
    assert.equal(service.create.mock.callCount(), 0);
    assert.equal(service.submit.mock.callCount(), 0);
  });

  it("rejects excessively nested JSON with 400 instead of failing later", async (t) => {
    const { app } = await createApp();
    t.after(() => app.close());

    const feedback = (message: string) =>
      app.inject({
        method: "POST",
        url: "/api/public/feedback",
        payload: `{"category":"bug","message":${message}}`,
        headers: { "content-type": "application/json" },
      });
    for (const depth of [MAX_BODY_DEPTH, 10_000, 100_000]) {
      const response = await feedback(nested(depth));
      assert.equal(response.statusCode, 400);
      assert.equal(response.json().message, `Request body must not be nested deeper than ${MAX_BODY_DEPTH} levels`);
    }
    // One level less passes the guard and reaches the schema instead.
    const allowed = await feedback(nested(MAX_BODY_DEPTH - 1));
    assert.equal(allowed.statusCode, 400);
    assert.equal(allowed.json().message, "body/message must be string");

    assert.equal(findViolation(JSON.parse(nested(1_000_000)), { maxDepth: MAX_BODY_DEPTH }), "too_deep");
  });

  it("rejects non-finite, oversized and unknown query parameters on the admin lists with 400", async (t) => {
    const { app, service } = await createApp();
    t.after(() => app.close());

    for (const path of ["/api/admin/submissions", "/api/admin/feedback"]) {
      for (const query of [
        "limit=Infinity",
        "limit=-Infinity",
        "limit=1e400",
        `limit=${"9".repeat(400)}`,
        "limit=999999999999999999999999",
        "skip=Infinity",
        "skip=999999999999999999999999",
        "skip=2147483648",
        "limit=1&foo=bar",
        "foo=bar",
      ]) {
        const response = await app.inject({ method: "GET", url: `${path}?${query}` });
        assert.equal(response.statusCode, 400, `${path}?${query}: ${response.body}`);
        assert.equal(response.json().status, "BAD_REQUEST");
      }
      const valid = await app.inject({ method: "GET", url: `${path}?limit=100&skip=2147483647` });
      assert.equal(valid.statusCode, 200, valid.body);
    }
    assert.equal(service.list.mock.callCount(), 2);
  });

  it("rejects unknown body fields and type-coerced values with 400", async (t) => {
    const { app, service } = await createApp();
    t.after(() => app.close());

    for (const request of [
      { url: "/api/public/submissions/deletion-receipts/verify", payload: { ...receipt, extra: "x" } },
      { url: "/api/public/submissions/deletion-receipts/verify", payload: { ...receipt, deletedCount: "1" } },
      { url: "/api/public/submissions/status", payload: { deletionToken: "t", extra: 1 } },
      { url: "/api/public/feedback", payload: { category: "bug", message: 12345 } },
      { url: "/api/public/feedback", payload: { category: "bug", message: true } },
      { url: "/api/public/feedback", payload: { category: "bug", message: "hi", extra: 1 } },
    ]) {
      const response = await app.inject({ method: "POST", ...request });
      assert.equal(response.statusCode, 400, `${request.url}: ${response.body}`);
    }
    assert.equal(service.create.mock.callCount(), 0);
    assert.equal(service.verifyDeletionReceipt.mock.callCount(), 0);

    const valid = await app.inject({
      method: "POST",
      url: "/api/public/submissions/deletion-receipts/verify",
      payload: receipt,
    });
    assert.equal(valid.statusCode, 200);
    const feedback = await app.inject({
      method: "POST",
      url: "/api/public/feedback",
      payload: { category: "bug", message: "12345", emailAddress: "a@example.org" },
    });
    assert.equal(feedback.statusCode, 201);
  });

  it("answers JSON bodies declared in another charset than UTF-8 with 415", async (t) => {
    const { app, service } = await createApp();
    t.after(() => app.close());

    const verify = (contentType: string) =>
      app.inject({
        method: "POST",
        url: "/api/public/submissions/deletion-receipts/verify",
        payload: JSON.stringify(receipt),
        headers: { "content-type": contentType },
      });
    for (const contentType of [
      "application/json; charset=latin1",
      "application/json; charset=ISO-8859-1",
      "application/json;charset=\"utf-16\"",
    ]) {
      const response = await verify(contentType);
      assert.equal(response.statusCode, 415, contentType);
      assert.deepEqual(response.json(), {
        status: "UNSUPPORTED_MEDIA_TYPE",
        code: 415,
        message: "JSON request bodies must be UTF-8",
      });
    }
    for (const contentType of ["application/json", "application/json; charset=utf-8", "Application/JSON; Charset=\"UTF-8\""])
      assert.equal((await verify(contentType)).statusCode, 200, contentType);
    assert.equal(service.verifyDeletionReceipt.mock.callCount(), 3);

    assert.equal(hasNonUtf8JsonCharset("text/plain; charset=latin1"), false);
    assert.equal(hasNonUtf8JsonCharset("application/ld+json; charset=latin1"), true);
  });
});

describe("database error mapping", () => {
  it("maps concurrency conflicts to 409, vanished records to 404 and NUL bytes to 400", async () => {
    const statuses = async (error: unknown) => {
      const mapped = toDatabaseAppError(error);
      return mapped && [mapped.code, mapped.status, mapped.message];
    };
    const conflict = [409, "CONFLICT", "The resource was changed by a concurrent request, please retry"];
    for (const code of ["40001", "40P01", "23505", "23503", "55P03"])
      assert.deepEqual(await statuses(await ormError("insert", code)), conflict, code);
    assert.deepEqual(await statuses(await ormError("delete")), [404, "NOT_FOUND", "Not found"]);
    assert.deepEqual(await statuses(await ormError("insert", "22021")), [
      400, "BAD_REQUEST", "Request contains characters that cannot be stored",
    ]);
    // A serialization failure raised on COMMIT reaches the handler unwrapped.
    const commitFailure = Object.assign(new pg.DatabaseError("could not serialize", 0, "error"), {
      severity: "ERROR",
      code: "40001",
    });
    assert.deepEqual(await statuses(commitFailure), conflict);

    // Everything else stays an internal error.
    assert.equal(await statuses(await ormError("insert", "23514")), undefined);
    assert.equal(await statuses(new Error("40001")), undefined);
    assert.equal(await statuses(Object.assign(new Error("x"), { code: "40001" })), undefined);
  });

  it("answers the losing side of a concurrent operation with 409 instead of 500", async (t) => {
    const { app } = await createApp(await ormError("insert", "40001"));
    t.after(() => app.close());

    const response = await app.inject({ method: "POST", url: "/api/public/submissions", payload: validSubmission() });
    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.json(), {
      status: "CONFLICT",
      code: 409,
      message: "The resource was changed by a concurrent request, please retry",
    });
  });
});
