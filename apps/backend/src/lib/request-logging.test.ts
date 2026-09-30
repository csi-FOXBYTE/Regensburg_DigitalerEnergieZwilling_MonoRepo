import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { describe, it } from "node:test";
import Fastify, { type FastifyBaseLogger } from "fastify";
import pino from "pino";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import feedbackController from "../feedbackPublic/feedbackPublic.controller.js";
import submissionsController from "../submissionsPublic/submissionsPublic.controller.js";
import { normalizeFeedbackInput } from "../feedback/feedback.service.js";
import { ConfigNotFoundError } from "../submissions/submissions.errors.js";
import { routeErrorHandler } from "../errors/route-error-handler.js";
import { schema } from "../zenstack/schema.js";
import { createPrivacyLogger, injectPinoLogger } from "./pino.js";
import { installRequestLogging } from "./request-logging.js";

const secret = "PRIVATE_USER_DATA_MARKER";
const email = "private@example.invalid";
const feedback = { category: "bug", message: secret, emailAddress: email };
const submission = { input: { details: secret }, address: secret, buildingId: secret, longitude: 12, latitude: 49 };

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
      get: async (name: string) => name === "feedback" ? {
        create: async (input: Parameters<typeof normalizeFeedbackInput>[0]) => {
          normalizeFeedbackInput(input);
          if (failure) throw failure;
        },
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
  const app = Fastify({ loggerInstance: pino({ level: "trace" }, output.stream) as FastifyBaseLogger, requestIdHeader: "x-request-id" });
  installRequestLogging(app, createPrivacyLogger({ base: undefined, level: "trace" }, output.stream));
  await app.register(fastifyToab, {
    getRegistries: async () => ({ controllerRegistry, serviceRegistry, workerRegistry: {} as WorkerRegistry }),
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

function assertSafe(output: ReturnType<typeof capture>) {
  assert.doesNotMatch(output.lines.join(""), new RegExp(`${secret}|${email}|authorization|sqlParams|stack|remoteAddress`));
  for (const record of output.records()) {
    assert.deepEqual(Object.keys(record).filter((key) => ![
      "level", "time", "event", "requestId", "route", "method", "statusCode", "durationMs", "errorCode",
    ].includes(key)), []);
  }
}

describe("request log privacy", () => {
  it("keeps successful submissions, feedback, queries, headers and request IDs out of logs", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    for (const [url, payload, status] of [
      ["/api/public/feedback", feedback, 201],
      ["/api/public/submissions", submission, 200],
    ] as const) {
      const response = await app.inject({
        method: "POST", url: `${url}?email=${email}&data=${secret}`, payload,
        headers: { authorization: `Bearer ${secret}`, cookie: secret, referer: secret, "x-request-id": secret, "user-agent": secret },
      });
      assert.equal(response.statusCode, status);
    }
    assertSafe(output);
    assert.equal(output.records().length, 2);
    for (const record of output.records()) {
      assert.equal(record.event, "request_completed");
      assert.match(record.requestId, /^[0-9a-f-]{36}$/);
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
      for (const suffix of ["status", "download"]) {
        assert.equal((await app.inject(`/api/public/submissions/${secret}/${suffix}`)).statusCode, failure ? 500 : 200);
      }
      assert.equal((await app.inject({ method: "DELETE", url: `/api/public/submissions/${secret}` })).statusCode, failure ? 500 : 200);
      assert.equal((await app.inject(`/api/public/submissions/${secret}/typo?email=${email}`)).statusCode, 404);
      assertSafe(output);
      assert.deepEqual(output.records().map((record) => record.route), [
        "/api/public/submissions/:deletionToken/status",
        "/api/public/submissions/:deletionToken/download",
        "/api/public/submissions/:deletionToken",
        "unmatched_route",
      ]);
    }
  });

  it("does not let route log levels re-enable raw request or framework logging", async (t) => {
    const { app, output } = await testApp();
    t.after(() => app.close());
    assert.equal((await app.inject(`/request-log/${secret}`)).statusCode, 200);
    assertSafe(output);
    assert.equal(output.records().length, 1);
    assert.equal(output.records()[0].route, "/request-log/:id");
  });
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
