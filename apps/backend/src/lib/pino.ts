import { pino, type DestinationStream, type LoggerOptions } from "pino";

export type ErrorCategory =
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR";

// Values from exceptions are classified, never copied into a log record.
export function errorCategory(error: unknown): ErrorCategory {
  if (typeof error !== "object" || error === null) return "INTERNAL_ERROR";
  if ("reason" in error && error.reason === "db-query-error") return "DATABASE_ERROR";
  if ("validation" in error) return "VALIDATION_ERROR";
  if ("code" in error && error.code === "FST_ERR_CTP_INVALID_JSON_BODY") return "BAD_REQUEST";
  if ("status" in error) {
    switch (error.status) {
      case "BAD_REQUEST": return "BAD_REQUEST";
      case "UNAUTHORIZED": return "UNAUTHORIZED";
      case "FORBIDDEN": return "FORBIDDEN";
      case "NOT_FOUND": return "NOT_FOUND";
      case "METHOD_NOT_ALLOWED": return "METHOD_NOT_ALLOWED";
    }
  }
  return "INTERNAL_ERROR";
}

type ConsoleLevel = "info" | "warn" | "error" | "debug";

type LogEvent =
  | {
      event: "request_completed" | "request_failed" | "request_aborted" | "request_timeout";
      requestId: string;
      route: string;
      method: string;
      statusCode?: number;
      durationMs: number;
      errorCode?: ErrorCategory;
    }
  | { event: "console_output"; level: ConsoleLevel; errorCode?: ErrorCategory }
  | { event: "server_listening" | "server_closed" };

export type PrivacyLogger = (event: LogEvent) => void;

export const loggerOptions: LoggerOptions = {
  base: undefined,
  ...(process.env.NODE_ENV === "development" ? {
    transport: {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
    },
  } : {}),
};

export function createPrivacyLogger(
  options: LoggerOptions = loggerOptions,
  destination?: DestinationStream,
): PrivacyLogger {
  const output = destination ? pino(options, destination) : pino(options);
  return (event) => {
    // Construct a fresh allowlisted record, even if the caller supplies extra fields.
    if (event.event === "console_output") {
      output[event.level]({ event: event.event, errorCode: event.errorCode });
    } else if ("requestId" in event) {
      const level = event.event === "request_failed"
        ? ((event.statusCode ?? 500) >= 500 ? "error" : "warn")
        : "info";
      output[level]({
        event: event.event,
        requestId: event.requestId,
        route: event.route,
        method: event.method,
        statusCode: event.statusCode,
        durationMs: event.durationMs,
        errorCode: event.errorCode,
      });
    } else {
      output.info({ event: event.event });
    }
  };
}

export const logEvent = createPrivacyLogger();

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
