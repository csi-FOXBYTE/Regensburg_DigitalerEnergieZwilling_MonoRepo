import { STATUS_CODES } from "node:http";
import type { Socket } from "node:net";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { AppError, httpErrorMessage, httpErrorStatus, sendAppError } from "./app-error.js";

type FrameworkErrorHandler = NonNullable<FastifyServerOptions["frameworkErrors"]>;

// Router errors (FST_ERR_BAD_URL, FST_ERR_MAX_PARAM_LENGTH,
// FST_ERR_ASYNC_CONSTRAINT) carry the request path in their message, so only
// the status code is kept.
export function toFrameworkAppError(statusCode: number | undefined): AppError {
  const code = statusCode !== undefined && statusCode >= 400 && statusCode < 500 ? statusCode : 500;
  if (code === 500) return new AppError({ status: "INTERNAL_ERROR", code, message: "Internal server error" });
  return new AppError({
    status: httpErrorStatus[code] ?? "BAD_REQUEST",
    code,
    message: httpErrorMessage[code] ?? "Bad request",
  });
}

const frameworkErrorHandler: FrameworkErrorHandler = (error, _request, reply) => {
  sendAppError(reply, toFrameworkAppError(error.statusCode));
};

// Mirrors Fastify's defaultClientErrorHandler, which answers HTTP parser
// errors on the raw socket, but with the AppError body.
function clientErrorHandler(error: Error & { code?: string }, socket: Socket) {
  if (error.code === "ECONNRESET" || socket.destroyed) return;
  const code = error.code === "ERR_HTTP_REQUEST_TIMEOUT" ? 408 : error.code === "HPE_HEADER_OVERFLOW" ? 431 : 400;
  const body = JSON.stringify(toFrameworkAppError(code).toResponse(false));
  if (socket.writable)
    socket.write(
      `HTTP/1.1 ${code} ${STATUS_CODES[code]}\r\nContent-Length: ${Buffer.byteLength(body)}\r\n` +
        `Content-Type: application/json; charset=utf-8\r\nConnection: close\r\n\r\n${body}`,
    );
  socket.destroy(error);
}

// fastify-toab creates the Fastify instance itself and passes no server
// options, so frameworkErrors and clientErrorHandler cannot be set there.
// Fastify reads frameworkErrors from its options object on every router
// error, so setting it on the instance's options has the same effect.
// Without this, a path parameter over 100 characters or a malformed percent
// escape is answered with Fastify's own body, which repeats the request path.
export function installFrameworkErrorHandlers(fastify: FastifyInstance) {
  const optionsSymbol = Object.getOwnPropertySymbols(fastify).find(
    (symbol) => symbol.description === "fastify.options",
  );
  const options = optionsSymbol
    ? (fastify as unknown as Record<symbol, { frameworkErrors?: FrameworkErrorHandler } | undefined>)[optionsSymbol]
    : undefined;
  // Fail at startup instead of silently answering with Fastify's body.
  if (typeof options !== "object" || options === null)
    throw new Error("Fastify options not found; cannot install the framework error handler");
  options.frameworkErrors = frameworkErrorHandler;

  fastify.server.removeAllListeners("clientError");
  fastify.server.on("clientError", clientErrorHandler);
}
