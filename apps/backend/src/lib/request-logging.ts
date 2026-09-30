import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pino } from "pino";
import { errorCategory, logEvent, type ErrorCategory, type PrivacyLogger } from "./pino.js";

const requestErrors = new WeakMap<FastifyRequest, ErrorCategory>();

export function recordRequestError(request: FastifyRequest, error: unknown) {
  requestErrors.set(request, errorCategory(error));
}

export function installRequestLogging(fastify: FastifyInstance, write: PrivacyLogger = logEvent) {
  // fastify-toab creates its own Pino instance and logs raw exceptions before
  // onRouteError. Silence it and its request loggers, including unmatched routes.
  // A factory is necessary: route/plugin logLevel can override the root level.
  fastify.log.level = "silent";
  const silentLogger = pino({ enabled: false });
  fastify.setChildLoggerFactory(() => silentLogger);
  fastify.addHook("onRoute", (route) => {
    route.childLoggerFactory = () => silentLogger;
  });

  const requests = new WeakMap<FastifyRequest, { id: string; startedAt: number; logged: boolean }>();
  const context = (request: FastifyRequest) => {
    let value = requests.get(request);
    if (!value) {
      value = { id: randomUUID(), startedAt: performance.now(), logged: false };
      requests.set(request, value);
    }
    return value;
  };
  const methods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "CONNECT"]);
  const complete = (
    request: FastifyRequest,
    event: "request_completed" | "request_failed" | "request_aborted" | "request_timeout",
    statusCode?: number,
  ) => {
    const state = context(request);
    if (state.logged) return;
    state.logged = true;
    write({
      event,
      requestId: state.id,
      // routeOptions.url is the registered template; never fall back to request.url.
      route: request.routeOptions.url ?? "unmatched_route",
      method: methods.has(request.method) ? request.method : "OTHER",
      statusCode,
      durationMs: Math.round((performance.now() - state.startedAt) * 100) / 100,
      errorCode: requestErrors.get(request),
    });
  };

  fastify.addHook("onRequest", async (request) => { context(request); });
  fastify.addHook("onError", async (request, _reply, error) => { recordRequestError(request, error); });
  fastify.addHook("onResponse", async (request, reply) => {
    complete(request, reply.statusCode >= 400 ? "request_failed" : "request_completed", reply.statusCode);
  });
  fastify.addHook("onTimeout", async (request) => { complete(request, "request_timeout"); });
  fastify.addHook("onRequestAbort", async (request) => { complete(request, "request_aborted"); });
  fastify.addHook("onListen", async () => { write({ event: "server_listening" }); });
  fastify.addHook("onClose", async () => { write({ event: "server_closed" }); });
}
