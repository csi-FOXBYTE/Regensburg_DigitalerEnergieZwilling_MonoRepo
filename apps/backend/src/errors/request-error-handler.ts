import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError, httpErrorStatus, sendAppError } from "./app-error.js";

// Errors raised by Fastify and its plugins outside a fastify-toab handler
// (schema validation, body parsing, rate limit, under-pressure). Fastify's
// default reply lacks `status`, which the generic ERROR_4xx response schemas
// require, so serialization would turn every 400 into a 500. Handler errors
// keep going through routeErrorHandler.
export function toRequestAppError(error: FastifyError): AppError {
  if (error.validation || error.code === "FST_ERR_VALIDATION")
    return new AppError({ status: "BAD_REQUEST", code: 400, message: error.message });

  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 400 && statusCode < 500)
    return new AppError({
      status: httpErrorStatus[statusCode] ?? "BAD_REQUEST",
      code: statusCode,
      message: error.message,
    });

  // Keep the code (e.g. 503 with Retry-After) but never a server-side message.
  const status = httpErrorStatus[statusCode];
  if (status && statusCode !== 500)
    return new AppError({ status, code: statusCode, message: "Service unavailable" });

  return AppError.fromUnknown(error);
}

export function requestErrorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  // The onError hook (request-logging.ts) has already recorded the raw error.
  sendAppError(reply, error instanceof AppError ? error : toRequestAppError(error));
}
