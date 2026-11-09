import { pino, type DestinationStream, type Level, type Logger, type LoggerOptions } from "pino";
import { httpErrorStatus, type AppErrorStatus } from "../errors/app-error.js";

export type ErrorCategory = AppErrorStatus | "DATABASE_ERROR" | "VALIDATION_ERROR";

const appErrorStatuses = new Set<unknown>(Object.values(httpErrorStatus));

// Values from exceptions are classified, never copied into a log record.
export function errorCategory(error: unknown): ErrorCategory {
  if (typeof error !== "object" || error === null) return "INTERNAL_ERROR";
  if ("reason" in error && error.reason === "db-query-error") return "DATABASE_ERROR";
  if ("validation" in error) return "VALIDATION_ERROR";
  if ("code" in error && error.code === "FST_ERR_CTP_INVALID_JSON_BODY") return "BAD_REQUEST";
  if ("status" in error && appErrorStatuses.has(error.status)) return error.status as AppErrorStatus;
  // Framework and plugin errors (413, 415, 429, 503) only carry a statusCode.
  if ("statusCode" in error && typeof error.statusCode === "number") {
    const status = httpErrorStatus[error.statusCode];
    if (status) return status;
    if (error.statusCode >= 400 && error.statusCode < 500) return "BAD_REQUEST";
  }
  return "INTERNAL_ERROR";
}

type ConsoleLevel = "info" | "warn" | "error" | "debug";

export type LogEvent =
  | {
      event: "request_completed" | "request_failed" | "request_aborted" | "request_timeout";
      requestId: string;
      route: string;
      method: string;
      statusCode?: number;
      durationMs: number;
      errorCode?: ErrorCategory;
      // Admin routes only: who acted on which object (see request-logging.ts).
      actor?: "user" | "anonymous";
      actorId?: string;
      actorRoles?: string[];
      targetType?: string;
      targetId?: string;
    }
  | { event: "console_output"; level: ConsoleLevel; errorCode?: ErrorCategory }
  | { event: "feedback_notification_failed" }
  | { event: "auth_key_set_unavailable" }
  | { event: "analytics_config"; state: "active" | "inactive" | "invalid" }
  | { event: "deletion_expiry_backfill" | "deletion_expiry_cleared"; count: number }
  // Only the names of missing or invalid variables (src/toab/run.ts).
  | { event: "env_invalid"; variables: string[] }
  | { event: "server_listening" | "server_closed" };

export type PrivacyLogger = (event: LogEvent) => void;

const events = new Set<string>([
  "request_completed", "request_failed", "request_aborted", "request_timeout", "console_output",
  "feedback_notification_failed", "auth_key_set_unavailable", "analytics_config",
  "deletion_expiry_backfill", "deletion_expiry_cleared", "env_invalid", "server_listening", "server_closed",
] satisfies LogEvent["event"][]);

const isLogEvent = (value: unknown): value is LogEvent =>
  typeof value === "object" && value !== null && !(value instanceof Error) &&
  "event" in value && typeof value.event === "string" && events.has(value.event);

function levelOf(event: LogEvent): Level {
  switch (event.event) {
    case "console_output": return event.level;
    case "request_failed": return (event.statusCode ?? 500) >= 500 ? "error" : "warn";
    case "feedback_notification_failed":
    case "auth_key_set_unavailable": return "error";
    case "analytics_config": return event.state === "invalid" ? "warn" : "info";
    case "env_invalid": return "fatal";
    default: return "info";
  }
}

// Construct a fresh allowlisted record, even if the caller supplies extra fields.
function eventRecord(event: LogEvent): Record<string, unknown> {
  switch (event.event) {
    case "console_output":
      return { event: event.event, errorCode: event.errorCode };
    case "request_completed":
    case "request_failed":
    case "request_aborted":
    case "request_timeout":
      return {
        event: event.event,
        requestId: event.requestId,
        route: event.route,
        method: event.method,
        statusCode: event.statusCode,
        durationMs: event.durationMs,
        errorCode: event.errorCode,
        actor: event.actor,
        actorId: event.actorId,
        actorRoles: event.actorRoles,
        targetType: event.targetType,
        targetId: event.targetId,
      };
    case "analytics_config":
      // Only whether web analytics is on, never the tracker URL or site ID.
      return { event: event.event, state: event.state };
    case "deletion_expiry_backfill":
    case "deletion_expiry_cleared":
      // Only the count: no ids or token hashes in the log.
      return { event: event.event, count: event.count };
    case "env_invalid":
      return {
        event: event.event,
        variables: event.variables.filter((name) => /^[A-Z][A-Z0-9_]{0,63}$/.test(name)),
      };
    default:
      return { event: event.event };
  }
}

function errorIn(args: readonly unknown[]): unknown {
  for (const arg of args) {
    if (arg instanceof Error) return arg;
    if (typeof arg === "object" && arg !== null) {
      if ("err" in arg && arg.err instanceof Error) return arg.err;
      if ("error" in arg && arg.error instanceof Error) return arg.error;
    }
  }
  return undefined;
}

// Every log call goes through here: logEvent, fastify.log, request.log and the
// loggers Fastify plugins derive from them. A LogEvent becomes its allowlisted
// record. Anything else (free text, objects, errors) keeps only its level and,
// for errors, the category: messages, request data and stacks may all contain
// submitted data or tokens.
function sanitize(args: readonly unknown[]): Record<string, unknown> {
  if (isLogEvent(args[0])) return eventRecord(args[0]);
  const error = errorIn(args);
  return { event: "logger_output", ...(error === undefined ? {} : { errorCode: errorCategory(error) }) };
}

export const loggerOptions: LoggerOptions = process.env.NODE_ENV === "development" ? {
  transport: {
    target: "pino-pretty",
    options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
  },
} : {};

/**
 * Pino logger whose records only ever contain level, time and the allowlisted
 * fields of sanitize(). It is also Fastify's logger (fastify-toab.config.ts).
 */
export function createLogger(options: LoggerOptions = loggerOptions, destination?: DestinationStream): Logger {
  const settings: LoggerOptions = {
    ...options,
    base: undefined,
    hooks: {
      logMethod(args, method) {
        method.call(this, sanitize(args));
      },
    },
  };
  const logger = destination ? pino(settings, destination) : pino(settings);
  // Child loggers inherit this override, so no binding (Fastify's reqId, a
  // plugin's context) is ever added to a record; options such as the level
  // still apply.
  const child = logger.child;
  logger.child = function (this: Logger, _bindings, childOptions) {
    return child.call(this, {}, childOptions);
  } as Logger["child"];
  return logger;
}

export function eventWriter(logger: Logger): PrivacyLogger {
  return (event) => logger[levelOf(event)](event);
}

export function createPrivacyLogger(
  options: LoggerOptions = loggerOptions,
  destination?: DestinationStream,
): PrivacyLogger {
  return eventWriter(createLogger(options, destination));
}

export const logger = createLogger();

export const logEvent = eventWriter(logger);

export function injectPinoLogger(write: PrivacyLogger = logEvent) {
  const forward = (level: ConsoleLevel, args: unknown[]) => {
    const error = args.find((arg) => arg instanceof Error);
    write({
      event: "console_output",
      level,
      ...(error ? { errorCode: errorCategory(error) } : {}),
    });
  };

  // Free text, objects, error messages and stacks may all contain submitted data.
  console.log = (...args: unknown[]) => forward("info", args);
  console.info = (...args: unknown[]) => forward("info", args);
  console.warn = (...args: unknown[]) => forward("warn", args);
  console.error = (...args: unknown[]) => forward("error", args);
  console.debug = (...args: unknown[]) => forward("debug", args);
}
