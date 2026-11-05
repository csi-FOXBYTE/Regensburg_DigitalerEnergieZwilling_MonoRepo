import type {
  FastifyToabRouteErrorContext,
} from "../toab/index.js";
import { AppError, sendAppError } from "./app-error.js";
import { toDatabaseAppError } from "./database-error.js";
import { recordRequestError } from "../lib/request-logging.js";

export function routeErrorHandler(ctx: FastifyToabRouteErrorContext): void {
  // onResponse emits one safe record. Never pass the raw error to a logger.
  recordRequestError(ctx.request, ctx.error);

  sendAppError(ctx.reply, toDatabaseAppError(ctx.error) ?? AppError.fromUnknown(ctx.error));
}
