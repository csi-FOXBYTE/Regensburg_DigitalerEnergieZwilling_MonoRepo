import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError, type AppErrorStatus } from "./app-error.js";
import { recordRequestError } from "../lib/request-logging.js";

const clientErrorStatus: Record<number, AppErrorStatus> = {
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
};

// Errors raised by Fastify before a handler runs (schema validation, body
// parsing). Fastify's default reply lacks `status`, which the generic ERROR_4xx
// response schemas require, so serialization would turn every 400 into a 500.
// Handler errors keep going through routeErrorHandler.
export function toRequestAppError(error: FastifyError): AppError {
  if (error.validation || error.code === "FST_ERR_VALIDATION")
    return new AppError({ status: "BAD_REQUEST", code: 400, message: error.message });

  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 400 && statusCode < 500)
    return new AppError({
      status: clientErrorStatus[statusCode] ?? "BAD_REQUEST",
      code: statusCode,
      message: error.message,
    });

  return AppError.fromUnknown(error);
}

export function requestErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const appError = error instanceof AppError ? error : toRequestAppError(error);
  const includeStack = process.env.NODE_ENV === "development";

  recordRequestError(request, error);

  reply.code(appError.code).send(appError.toResponse(includeStack));
}
