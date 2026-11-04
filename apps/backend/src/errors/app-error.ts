import type { FastifyReply } from "fastify";

export type AppErrorStatus =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "REQUEST_TIMEOUT"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "URI_TOO_LONG"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "TOO_MANY_REQUESTS"
  | "REQUEST_HEADER_FIELDS_TOO_LARGE"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

// HTTP status codes that framework and plugin errors (body limit, media type,
// router and HTTP parser limits, under-pressure) carry, mapped to the status
// clients branch on. Application errors use the same label for the same code.
export const httpErrorStatus: Readonly<Record<number, AppErrorStatus>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  408: "REQUEST_TIMEOUT",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  414: "URI_TOO_LONG",
  415: "UNSUPPORTED_MEDIA_TYPE",
  429: "TOO_MANY_REQUESTS",
  431: "REQUEST_HEADER_FIELDS_TOO_LARGE",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

type AppErrorInput = {
  status: AppErrorStatus;
  code: number;
  message: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly status: AppErrorStatus;
  readonly code: number;

  constructor(input: AppErrorInput) {
    super(input.message);
    this.name = "AppError";
    this.status = input.status;
    this.code = input.code;
  }

  toResponse(includeStack: boolean) {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      ...(includeStack ? { stack: this.stack } : {}),
    };
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) return error;

    if (error instanceof Error) {
      return new AppError({
        status: "INTERNAL_ERROR",
        code: 500,
        message: "Internal server error",
        cause: error,
      });
    }

    return new AppError({
      status: "INTERNAL_ERROR",
      code: 500,
      message: "Internal server error",
      cause: error,
    });
  }
}

export function sendAppError(reply: FastifyReply, error: AppError): void {
  const includeStack = process.env.NODE_ENV === "development";
  reply.code(error.code).send(error.toResponse(includeStack));
}
