export type AppErrorStatus =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR";

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
