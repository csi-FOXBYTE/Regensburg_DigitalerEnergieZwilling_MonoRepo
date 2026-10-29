import type { FastifyReply } from "fastify";

export type AppErrorStatus =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

// HTTP status codes that framework and plugin errors (rate limit, body limit,
// under-pressure) carry, mapped to the status clients branch on.
export const httpErrorStatus: Readonly<Record<number, AppErrorStatus>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  429: "TOO_MANY_REQUESTS",
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
