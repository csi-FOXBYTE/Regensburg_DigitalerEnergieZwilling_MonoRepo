import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError, httpErrorMessage, httpErrorStatus, sendAppError } from "./app-error.js";

// Messages for Fastify's body parser errors. Their own texts are fixed today,
// but any plugin or parser message may quote the Content-Type or the body,
// so only these texts and the per-status defaults reach the client.
const bodyParserMessages: Readonly<Record<string, string>> = {
  FST_ERR_CTP_INVALID_JSON_BODY: "Request body is not valid JSON",
  FST_ERR_CTP_EMPTY_JSON_BODY: "Request body must not be empty",
  FST_ERR_CTP_INVALID_CONTENT_LENGTH: "Request body size does not match Content-Length",
  FST_ERR_CTP_BODY_TOO_LARGE: "Request body is too large",
  FST_ERR_CTP_INVALID_MEDIA_TYPE: "Unsupported media type",
};

// Errors raised by Fastify and its plugins outside a fastify-toab handler
// (schema validation, body parsing, under-pressure). Fastify's
// default reply lacks `status`, which the generic ERROR_4xx response schemas
// require, so serialization would turn every 400 into a 500. Handler errors
// keep going through routeErrorHandler; AppErrors thrown by hooks (request
// guards, Altcha) keep their message in requestErrorHandler.
export function toRequestAppError(error: FastifyError): AppError {
  // Ajv messages name the failing schema path and keyword, not the value.
  if (error.validation || error.code === "FST_ERR_VALIDATION")
    return new AppError({ status: "BAD_REQUEST", code: 400, message: error.message });

  const statusCode = error.statusCode ?? 500;
  if (statusCode >= 400 && statusCode < 500)
    return new AppError({
      status: httpErrorStatus[statusCode] ?? "BAD_REQUEST",
      code: statusCode,
      message: bodyParserMessages[error.code] ?? httpErrorMessage[statusCode] ?? "Bad request",
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
