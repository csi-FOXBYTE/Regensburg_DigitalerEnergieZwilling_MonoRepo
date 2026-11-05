import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { pino } from "pino";
import { errorCategory, logEvent, type ErrorCategory, type PrivacyLogger } from "./pino.js";

const requestErrors = new WeakMap<FastifyRequest, ErrorCategory>();
const requestActors = new WeakMap<FastifyRequest, { id?: string; roles: string[] }>();

// Identifiers are logged only if they look like one; anything else (free text,
// e-mail addresses, paths) is dropped rather than copied into a log record.
const safeId = (value: unknown): string | undefined =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/.test(value) ? value : undefined;

// Admin route params that name the object an action applies to. Public routes
// are never inspected: their params can be capability tokens.
const adminTargets: Record<string, string> = {
  submissionId: "submission",
  feedbackId: "feedback",
  versionName: "config_version",
  buildingId: "building",
};

export function recordRequestError(request: FastifyRequest, error: unknown) {
  requestErrors.set(request, errorCategory(error));
}

// Called once an access token has been verified, before any role check, so a
// rejected (403) request is still attributed. The subject is the internal user
// ID; name, e-mail and the token itself are never recorded.
export function recordRequestActor(request: FastifyRequest, subject: string | undefined, roles: readonly string[]) {
  if (subject === undefined) return;
  requestActors.set(request, { id: safeId(subject), roles: [...roles] });
}

function adminAuditFields(request: FastifyRequest, route: string | undefined) {
  if (!route?.startsWith("/api/admin/")) return {};
  const actor = requestActors.get(request);
  const params = (request.params ?? {}) as Record<string, unknown>;
  const targetParam = Object.keys(adminTargets).find((name) => params[name] !== undefined);
  return {
    ...(actor
      ? { actor: "user" as const, actorId: actor.id, actorRoles: actor.roles }
      : { actor: "anonymous" as const }),
    ...(targetParam
      ? { targetType: adminTargets[targetParam], targetId: safeId(params[targetParam]) }
      : {}),
  };
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
    const route = request.routeOptions.url;
    write({
      event,
      requestId: state.id,
      // routeOptions.url is the registered template; never fall back to request.url.
      route: route ?? "unmatched_route",
      method: methods.has(request.method) ? request.method : "OTHER",
      statusCode,
      durationMs: Math.round((performance.now() - state.startedAt) * 100) / 100,
      errorCode: requestErrors.get(request),
      ...adminAuditFields(request, route),
    });
  };

  // The ID is generated here, never taken from the client: an incoming
  // X-Request-Id is ignored, so it cannot be spoofed or inject log content.
  fastify.addHook("onRequest", async (request, reply) => {
    reply.header("X-Request-Id", context(request).id);
  });
  fastify.addHook("onError", async (request, _reply, error) => { recordRequestError(request, error); });
  fastify.addHook("onResponse", async (request, reply) => {
    complete(request, reply.statusCode >= 400 ? "request_failed" : "request_completed", reply.statusCode);
  });
  fastify.addHook("onTimeout", async (request) => { complete(request, "request_timeout"); });
  fastify.addHook("onRequestAbort", async (request) => { complete(request, "request_aborted"); });
  fastify.addHook("onListen", async () => { write({ event: "server_listening" }); });
  fastify.addHook("onClose", async () => { write({ event: "server_closed" }); });
}
