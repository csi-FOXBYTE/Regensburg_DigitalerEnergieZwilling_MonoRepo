import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { describe, it } from "node:test";
import {
  ControllerRegistry,
  createFastify,
  fastifyToab,
  type ServiceRegistry,
} from "../toab/index.js";
import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import configController from "../config/config.controller.js";
import feedbackAdminController from "../feedbackAdmin/feedbackAdmin.controller.js";
import feedbackController from "../feedbackPublic/feedbackPublic.controller.js";
import submissionsAdminController from "../submissionsAdmin/submissionsAdmin.controller.js";
import submissionsController from "../submissionsPublic/submissionsPublic.controller.js";
import { AppError } from "../errors/app-error.js";
import { normalizeFeedbackInput } from "../feedback/feedback.service.js";
import { ConfigNotFoundError } from "../submissions/submissions.errors.js";
import { coreBaseInput } from "../submissions/submission-input.fixture.js";
import { routeErrorHandler } from "../errors/route-error-handler.js";
import { schema } from "../zenstack/schema.js";
import { createLogger, createPrivacyLogger, errorCategory, eventWriter, injectPinoLogger } from "./pino.js";
import { installRequestLogging } from "./request-logging.js";

const secret = "PRIVATE_USER_DATA_MARKER";
const email = "private@example.invalid";
const feedback = { category: "bug", message: secret, emailAddress: email };
const submission = {
  input: { ...coreBaseInput(), heat: { primaryEnergyCarrier: secret } },
  address: secret,
  buildingId: secret,
  longitude: 12,
  latitude: 49,
};
const userId = "0b6f3f2e-5d55-4c1a-9f7e-3a1d2c4b5e6f";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Bearer values that the fake auth service accepts; each carries PII claims
// that must never reach a log record.
const tokens: Record<string, string[]> = {
  [`${secret}.admin`]: ["admin", `${secret}_custom_role`],
  [`${secret}.manager`]: ["manager"],
  [`${secret}.maintainer`]: ["maintainer"],
};
const authService = {
  verifyRequest: async (request: { headers: Record<string, unknown> }) => {
    const roles = tokens[String(request.headers.authorization).replace(/^Bearer /, "")];
    if (!roles) throw new AppError({ status: "UNAUTHORIZED", code: 401, message: `Access token ${secret} is invalid` });
    return {
      sub: userId, email, preferred_username: email, name: secret, given_name: secret, family_name: secret,
      resource_access: { "digital-energy-twin": { roles } },
    };
  },
};
const bearer = (role: string) => ({ authorization: `Bearer ${secret}.${role}` });

function capture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, done) { lines.push(chunk.toString()); done(); },
  });
  return { lines, stream, records: () => lines.map((line) => JSON.parse(line)) };
}

async function databaseError() {
  // Run the real ORM error wrapper without a database or persistent records.
  const pool = {
    async connect() {
      return {
        async query(sql: string | { text: string }) {
          const text = typeof sql === "string" ? sql : sql.text;
          if (!/insert\s+into/i.test(text)) return { rows: [], rowCount: 0 };
          throw Object.assign(new Error(`Rejected ${secret}`), { code: "23514", detail: email });
        },
        release() {}, on() {}, removeListener() {},
      };
    },
    async end() {},
  };
  const db = new ZenStackClient(schema, { dialect: new PostgresDialect({ pool: pool as never }) });
  try {
    await db.feedback.create({ data: { ...feedback, category: "bug" } });
    assert.fail("Expected the synthetic INSERT to fail");
  } catch (error) {
    assert.equal((error as { reason: string }).reason, "db-query-error");
    assert.ok(JSON.stringify((error as { sqlParams: unknown }).sqlParams).includes(secret));
    return error;
  } finally {
    await db.$disconnect();
  }
}

async function testApp(failure?: unknown) {
  const output = capture();
  const serviceRegistry = {
    initializeInstant: async () => {},
    resolve: () => ({
      get: async (name: string) => name === "auth" ? authService : name === "database" ? {
        user: { upsert: async () => ({ id: userId, email, given_name: secret, family_name: secret }) },
      } : name === "config" ? {
        deleteConfig: async () => { throw failure ?? new Error(secret); },
      } : name === "feedback" ? {
        create: async (input: Parameters<typeof normalizeFeedbackInput>[0]) => {
          normalizeFeedbackInput(input);
          if (failure) throw failure;
        },
        list: async () => ({ total: 0, data: [] }),
        deleteById: async () => { if (failure) throw failure; },
      } : {
        submit: async (input: { configName?: string }) => {
          if (input.configName) throw new ConfigNotFoundError(input.configName);
          if (failure) throw failure;
          return { deletionToken: secret };
        },
        assertAvailableByToken: async () => { if (failure) throw failure; },
        getPublicDownloadByToken: async () => {
          if (failure) throw failure;
          return {
            id: secret, buildingId: secret, address: secret, longitude: 12, latitude: 49,
            createdAt: new Date(), rawInput: JSON.stringify({ secret }), ngsiData: JSON.stringify({ secret }),
          };
        },
        deleteByToken: async () => {
          if (failure) throw failure;
          return {
            version: 1, auditEventId: "11111111-1111-4111-8111-111111111111", deletedAt: new Date().toISOString(),
            action: "SUBMISSION_DELETE", actorType: "PUBLIC_CAPABILITY", targetType: "SUBMISSION",
            targetId: secret, deletedCount: 1, verificationSecret: "x".repeat(43),
          };
        },
      },
    }),
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  controllerRegistry.register(feedbackController);
  controllerRegistry.register(submissionsController);
  controllerRegistry.register(feedbackAdminController);
  controllerRegistry.register(submissionsAdminController);
  controllerRegistry.register(configController);
  // Wired like startServer(), which passes the logger of fastify-toab.config.ts.
  const logger = createLogger({ level: "trace" }, output.stream);
  const app = createFastify(logger, { requestIdHeader: "x-request-id" });
  installRequestLogging(app, eventWriter(logger));
  await app.register(fastifyToab, {
    getRegistries: async () => ({ controllerRegistry, serviceRegistry }),
    onRouteError: routeErrorHandler,
    logLevel: "trace",
  });
  app.get("/request-log/:id", { logLevel: "trace" }, async (request) => {
    request.log.error({ err: new Error(secret), body: feedback }, secret);
    app.log.error({ err: new Error(secret) }, secret);
    return { secret };
  });
  await app.ready();
  return { app, output };
}

const auditKeys = ["actor", "actorId", "actorRoles", "targetType", "targetId"];

function assertSafe(output: ReturnType<typeof capture>) {
  assert.doesNotMatch(output.lines.join(""), new RegExp(`${secret}|${email}|authorization|sqlParams|stack|remoteAddress`));
  for (const record of output.records()) {
    assert.deepEqual(Object.keys(record).filter((key) => ![
      "level", "time", "event", "requestId", "route", "method", "statusCode", "durationMs", "errorCode", ...auditKeys,
    ].includes(key)), []);
    // Actor and target are recorded for admin routes only, never for public
    // routes whose params can be capability tokens.
    if (!String(record.route).startsWith("/api/admin/"))
      assert.deepEqual(Object.keys(record).filter((key) => auditKeys.includes(key)), []);
  }
}

describe("request log privacy", () => {
  it("keeps successful submissions, feedback, queries, headers and request IDs out of logs", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    const responseIds: unknown[] = [];
    for (const [url, payload, status] of [
      ["/api/public/feedback", feedback, 201],
      ["/api/public/submissions", submission, 200],
    ] as const) {
      const response = await app.inject({
        method: "POST", url: `${url}?email=${email}&data=${secret}`, payload,
        headers: { authorization: `Bearer ${secret}`, cookie: secret, referer: secret, "x-request-id": secret, "user-agent": secret },
      });
      assert.equal(response.statusCode, status);
      responseIds.push(response.headers["x-request-id"]);
    }
    assertSafe(output);
    assert.equal(output.records().length, 2);
    for (const [index, record] of output.records().entries()) {
      assert.equal(record.event, "request_completed");
      assert.match(record.requestId, uuid);
      // Returned to the client; an incoming X-Request-Id is ignored.
      assert.equal(responseIds[index], record.requestId);
      assert.ok(record.durationMs >= 0);
    }
    assert.notEqual(output.records()[0].requestId, output.records()[1].requestId);
  });

  it("logs a real ORM error only once without SQL parameters, message or cause", async (t) => {
    const { app, output } = await testApp(await databaseError());
    t.after(() => app.close());
    for (const [url, payload] of [["/api/public/feedback", feedback], ["/api/public/submissions", submission]] as const) {
      assert.equal((await app.inject({ method: "POST", url, payload })).statusCode, 500);
    }
    assertSafe(output);
    assert.equal(output.records().length, 2);
    for (const record of output.records()) {
      assert.equal(record.errorCode, "DATABASE_ERROR");
      assert.equal(record.statusCode, 500);
      assert.equal(record.level, 50);
    }
  });

  it("classifies validation, malformed JSON and user-derived application errors", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    assert.equal((await app.inject({ method: "POST", url: "/api/public/feedback", payload: { ...feedback, category: secret } })).statusCode, 400);
    assert.equal((await app.inject({ method: "POST", url: "/api/public/feedback", payload: `{"message":"${secret}",`, headers: { "content-type": "application/json" } })).statusCode, 400);
    assert.equal((await app.inject({ method: "POST", url: "/api/public/submissions", payload: { ...submission, configName: secret } })).statusCode, 404);
    assertSafe(output);
    assert.deepEqual(output.records().map((record) => record.errorCode), ["VALIDATION_ERROR", "BAD_REQUEST", "NOT_FOUND"]);
  });

  it("uses route templates for capability URLs, including failed and unmatched requests", async (t) => {
    const previousBase = process.env.PUBLIC_CLIENT_BASE_URL;
    process.env.PUBLIC_CLIENT_BASE_URL = "https://example.invalid";
    t.after(() => {
      if (previousBase === undefined) Reflect.deleteProperty(process.env, "PUBLIC_CLIENT_BASE_URL");
      else process.env.PUBLIC_CLIENT_BASE_URL = previousBase;
    });
    for (const failure of [undefined, await databaseError()]) {
      const { app, output } = await testApp(failure);
      t.after(() => app.close());
      for (const suffix of ["status", "download", "delete"]) {
        const response = await app.inject({
          method: "POST",
          url: `/api/public/submissions/${suffix}`,
          payload: { deletionToken: secret },
        });
        assert.equal(response.statusCode, failure ? 500 : 200);
      }
      // The removed legacy GET download route is unmatched now.
      assert.equal((await app.inject(`/api/public/submissions/${secret}/download`)).statusCode, 404);
      assert.equal((await app.inject(`/api/public/submissions/${secret}/typo?email=${email}`)).statusCode, 404);
      assertSafe(output);
      assert.deepEqual(output.records().map((record) => record.route), [
        "/api/public/submissions/status",
        "/api/public/submissions/download",
        "/api/public/submissions/delete",
        "unmatched_route",
        "unmatched_route",
      ]);
    }
  });

  it("keeps only level and error category of request.log and fastify.log records, at any route log level", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    assert.equal((await app.inject(`/request-log/${secret}?email=${email}`)).statusCode, 200);
    assertSafe(output);
    assert.deepEqual(output.records().map(({ level, event, errorCode }) => ({ level, event, errorCode })), [
      { level: 50, event: "logger_output", errorCode: "INTERNAL_ERROR" },
      { level: 50, event: "logger_output", errorCode: "INTERNAL_ERROR" },
      { level: 30, event: "request_completed", errorCode: undefined },
    ]);
    assert.equal(output.records()[2].route, "/request-log/:id");
  });

  it("writes allowlisted events through fastify.log and drops messages, objects and bindings", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    app.log.info("Backend started");
    app.log.info({ event: "deletion_expiry_backfill", count: 2, ids: [secret] }, secret);
    app.log.child({ secret, email }).warn({ body: feedback }, `%s ${email}`, secret);
    app.log.child({ reqId: secret }, { level: "trace" }).trace(new Error(secret));
    app.log.error({ event: "request_completed", requestId: "r", route: "/x", method: "GET", durationMs: 1, url: secret });
    assert.doesNotMatch(output.lines.join(""), new RegExp(`${secret}|${email}|stack`));
    assert.deepEqual(output.records().map(({ time, ...record }) => (assert.equal(typeof time, "number"), record)), [
      { level: 30, event: "logger_output" },
      { level: 30, event: "deletion_expiry_backfill", count: 2 },
      { level: 40, event: "logger_output" },
      { level: 10, event: "logger_output", errorCode: "INTERNAL_ERROR" },
      { level: 50, event: "request_completed", requestId: "r", route: "/x", method: "GET", durationMs: 1 },
    ]);
  });
});

describe("admin request audit fields", () => {
  it("records actor, roles, target and result of admin actions without token, name or e-mail", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    const feedbackId = "5e0c8a4e-2f5d-4b7a-8d1c-9f3e2a1b0c4d";
    const submissionId = "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
    const requests = [
      // Successful delete by an admin; unknown roles are dropped.
      { method: "DELETE", url: `/api/admin/feedback/${feedbackId}?email=${email}`, headers: bearer("admin"), status: 204 },
      // Valid identity without the permission: rejected but attributed.
      { method: "DELETE", url: `/api/admin/feedback/${feedbackId}`, headers: bearer("manager"), status: 403 },
      // Controller-level authMiddleware plus requirePermission.
      { method: "DELETE", url: "/api/admin/submissions/building/DEBY_LOD2_4711", headers: bearer("maintainer"), status: 403 },
      // No or invalid token: anonymous, target still recorded.
      { method: "DELETE", url: `/api/admin/submissions/${submissionId}`, headers: {}, status: 401 },
      { method: "PATCH", url: "/api/admin/config/v2026-1/activate", headers: { authorization: `Bearer ${secret}` }, status: 401 },
      // A target that is not an identifier (here an e-mail address) is dropped.
      { method: "DELETE", url: `/api/admin/config/${encodeURIComponent(email)}`, headers: {}, status: 401 },
      // Admin route without a target param.
      { method: "GET", url: `/api/admin/feedback?search=${secret}`, headers: bearer("maintainer"), status: 200 },
    ] as const;
    const responseIds: unknown[] = [];
    for (const { method, url, headers, status } of requests) {
      const response = await app.inject({ method, url, headers: { ...headers, "x-request-id": secret } });
      assert.equal(response.statusCode, status, url);
      responseIds.push(response.headers["x-request-id"]);
    }
    assertSafe(output);
    const records = output.records();
    assert.deepEqual(records.map((record) => record.requestId), responseIds);
    assert.deepEqual(
      records.map(({ statusCode, actor, actorId, actorRoles, targetType, targetId }) =>
        ({ statusCode, actor, actorId, actorRoles, targetType, targetId })),
      [
        { statusCode: 204, actor: "user", actorId: userId, actorRoles: ["admin"], targetType: "feedback", targetId: feedbackId },
        { statusCode: 403, actor: "user", actorId: userId, actorRoles: ["manager"], targetType: "feedback", targetId: feedbackId },
        { statusCode: 403, actor: "user", actorId: userId, actorRoles: ["maintainer"], targetType: "building", targetId: "DEBY_LOD2_4711" },
        { statusCode: 401, actor: "anonymous", actorId: undefined, actorRoles: undefined, targetType: "submission", targetId: submissionId },
        { statusCode: 401, actor: "anonymous", actorId: undefined, actorRoles: undefined, targetType: "config_version", targetId: "v2026-1" },
        { statusCode: 401, actor: "anonymous", actorId: undefined, actorRoles: undefined, targetType: "config_version", targetId: undefined },
        { statusCode: 200, actor: "user", actorId: userId, actorRoles: ["maintainer"], targetType: undefined, targetId: undefined },
      ],
    );
    assert.deepEqual(records.map((record) => record.errorCode), [
      undefined, "FORBIDDEN", "FORBIDDEN", "UNAUTHORIZED", "UNAUTHORIZED", "UNAUTHORIZED", undefined,
    ]);
  });

  it("returns the request ID on failed and unmatched requests too", async (t) => {
    const { app, output } = await testApp(await databaseError());
    t.after(() => app.close());
    const responses = [
      await app.inject({ method: "DELETE", url: "/api/admin/feedback/x", headers: bearer("admin") }),
      await app.inject({ method: "POST", url: "/api/public/feedback", payload: feedback }),
      await app.inject({ url: `/api/admin/${secret}`, headers: { "x-request-id": "00000000-0000-4000-8000-000000000000" } }),
    ];
    assert.deepEqual(responses.map((response) => response.statusCode), [500, 500, 404]);
    assertSafe(output);
    const records = output.records();
    for (const [index, response] of responses.entries()) {
      assert.match(String(response.headers["x-request-id"]), uuid);
      assert.equal(response.headers["x-request-id"], records[index].requestId);
    }
    // Even a well-formed incoming ID is not adopted.
    assert.notEqual(records[2].requestId, "00000000-0000-4000-8000-000000000000");
    assert.equal(records[0].actorId, userId);
    assert.equal(records[0].errorCode, "DATABASE_ERROR");
    assert.equal(records[2].route, "unmatched_route");
    assert.equal(records[2].actor, undefined);
  });
});

it("logs the analytics state without tracker details and warns when it is invalid", () => {
  const output = capture();
  const write = createPrivacyLogger({ base: undefined, level: "trace" }, output.stream);
  for (const state of ["active", "inactive", "invalid"] as const) {
    write({ event: "analytics_config", state, trackerUrl: secret } as never);
  }
  assert.doesNotMatch(output.lines.join(""), new RegExp(secret));
  assert.deepEqual(
    output.records().map(({ level, event, state, ...rest }) => ({ level, event, state, rest: Object.keys(rest) })),
    [
      { level: 30, event: "analytics_config", state: "active", rest: ["time"] },
      { level: 30, event: "analytics_config", state: "inactive", rest: ["time"] },
      { level: 40, event: "analytics_config", state: "invalid", rest: ["time"] },
    ],
  );
});

it("logs the download expiry backfill with only its count", () => {
  const output = capture();
  const write = createPrivacyLogger({ base: undefined, level: "trace" }, output.stream);
  write({ event: "deletion_expiry_backfill", count: 81, ids: [secret] } as never);
  assert.doesNotMatch(output.lines.join(""), new RegExp(secret));
  assert.deepEqual(
    output.records().map(({ level, event, count, ...rest }) => ({ level, event, count, rest: Object.keys(rest) })),
    [{ level: 30, event: "deletion_expiry_backfill", count: 81, rest: ["time"] }],
  );
});

it("console forwarding drops arbitrary strings, objects, formatting arguments and errors", () => {
  const output = capture();
  const original = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  try {
    injectPinoLogger(createPrivacyLogger({ base: undefined, level: "trace" }, output.stream));
    console.log(secret);
    console.info(feedback);
    console.warn("email=%s", email);
    console.error(Object.assign(new Error(secret), { reason: "db-query-error", sqlParams: [email], cause: new Error(secret) }));
    console.debug({ err: new Error(secret) }, email);
  } finally {
    Object.assign(console, original);
  }
  assertSafe(output);
  assert.equal(output.records().length, 5);
  assert.equal(output.records()[3].errorCode, "DATABASE_ERROR");
});

it("classifies framework and plugin errors by their status code", () => {
  assert.equal(errorCategory({ statusCode: 413 }), "PAYLOAD_TOO_LARGE");
  assert.equal(errorCategory({ statusCode: 415 }), "UNSUPPORTED_MEDIA_TYPE");
  assert.equal(errorCategory({ statusCode: 429 }), "TOO_MANY_REQUESTS");
  assert.equal(errorCategory({ statusCode: 503 }), "SERVICE_UNAVAILABLE");
  assert.equal(errorCategory({ statusCode: 418 }), "BAD_REQUEST");
  assert.equal(errorCategory({ statusCode: 502 }), "INTERNAL_ERROR");
  assert.equal(errorCategory({ status: "SERVICE_UNAVAILABLE", code: 503 }), "SERVICE_UNAVAILABLE");
  assert.equal(errorCategory({ status: secret }), "INTERNAL_ERROR");
});
