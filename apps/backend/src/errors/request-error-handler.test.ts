import assert from "node:assert/strict";
import { describe, it } from "node:test";
import underPressure from "@fastify/under-pressure";
import Fastify, { type FastifyError } from "fastify";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceContainer,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import submissionsPublicController from "../submissionsPublic/submissionsPublic.controller.js";
import { requestErrorHandler, toRequestAppError } from "./request-error-handler.js";
import { routeErrorHandler } from "./route-error-handler.js";

const createTestApp = async (withErrorHandler = true) => {
  const service = {
    submit: async () => {
      throw new Error("Invalid requests must not reach the handler");
    },
  };
  const serviceContainer: ServiceContainer = {
    get: async <T>() => service as T,
  };
  const serviceRegistry = {
    initializeInstant: async () => undefined,
    resolve: () => serviceContainer,
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  controllerRegistry.register(submissionsPublicController);
  const workerRegistry = {} as WorkerRegistry;

  const app = Fastify();
  // Same order as startServer(): instrumentation, then the fastify-toab routes
  // with the generic ERROR_4xx response schemas enabled by default.
  if (withErrorHandler) app.setErrorHandler(requestErrorHandler);
  await app.register(fastifyToab, {
    getRegistries: async () => ({
      controllerRegistry,
      serviceRegistry,
      workerRegistry,
    }),
    includeGenericErrorResponses: true,
    onRouteError: routeErrorHandler,
  });
  await app.ready();
  return app;
};

const invalidRequests = [
  { name: "a missing required property", payload: { configName: "2026-08" } },
  {
    name: "a wrong type",
    payload: { input: {}, buildingId: 42, address: "Teststraße 1", longitude: "east", latitude: 49.1 },
  },
  { name: "malformed JSON", payload: '{"input": ', contentType: "application/json" },
  { name: "an empty JSON body", payload: "", contentType: "application/json" },
];

describe("request error handler", () => {
  it("documents the 500 that Fastify's default handler produces for schema violations", async (t) => {
    const app = await createTestApp(false);
    t.after(() => app.close());

    const response = await app.inject({
      method: "POST",
      url: "/api/public/submissions",
      payload: { configName: "2026-08" },
    });
    assert.equal(response.statusCode, 500);
  });

  for (const request of invalidRequests)
    it(`answers ${request.name} with 400 in the AppError shape`, async (t) => {
      const app = await createTestApp();
      t.after(() => app.close());

      const response = await app.inject({
        method: "POST",
        url: "/api/public/submissions",
        payload: request.payload,
        ...(request.contentType ? { headers: { "content-type": request.contentType } } : {}),
      });

      assert.equal(response.statusCode, 400);
      const body = response.json();
      assert.equal(body.status, "BAD_REQUEST");
      assert.equal(typeof body.message, "string");
      assert.equal(body.stack, undefined);
    });

  it("keeps other client errors schema-conformant", async (t) => {
    const app = await createTestApp();
    t.after(() => app.close());

    const response = await app.inject({
      method: "POST",
      url: "/api/public/submissions",
      payload: "<input/>",
      headers: { "content-type": "application/xml" },
    });

    assert.equal(response.statusCode, 415);
    assert.equal(response.json().status, "UNSUPPORTED_MEDIA_TYPE");
  });

  it("keeps the status of plugin errors instead of calling them bad requests", () => {
    const fastifyError = (statusCode: number, message = "plugin detail") =>
      Object.assign(new Error(message), { statusCode }) as FastifyError;
    const statuses = [413, 415, 429, 418, 503].map((code) => {
      const { status, code: responseCode } = toRequestAppError(fastifyError(code));
      return { status, code: responseCode };
    });
    assert.deepEqual(statuses, [
      { status: "PAYLOAD_TOO_LARGE", code: 413 },
      { status: "UNSUPPORTED_MEDIA_TYPE", code: 415 },
      { status: "TOO_MANY_REQUESTS", code: 429 },
      { status: "BAD_REQUEST", code: 418 },
      { status: "SERVICE_UNAVAILABLE", code: 503 },
    ]);
    assert.equal(toRequestAppError(fastifyError(503, "internal detail")).message, "Service unavailable");
    const internal = toRequestAppError(fastifyError(502, "internal detail"));
    assert.deepEqual([internal.status, internal.code, internal.message], ["INTERNAL_ERROR", 500, "Internal server error"]);
  });

  it("keeps 503 and Retry-After when under-pressure rejects an API request", async (t) => {
    const app = Fastify();
    // Same order as startServer(): plugins, onPreStart, then the API routes.
    await app.register(underPressure, {
      healthCheck: async () => false,
      healthCheckInterval: 60_000,
      retryAfter: 10,
    });
    app.setErrorHandler(requestErrorHandler);
    app.get("/api/public/ping", async () => ({ ok: true }));
    await app.ready();
    t.after(() => app.close());

    const response = await app.inject({ method: "GET", url: "/api/public/ping" });
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers["retry-after"], "10");
    assert.deepEqual(response.json(), { status: "SERVICE_UNAVAILABLE", code: 503, message: "Service unavailable" });
  });
});
