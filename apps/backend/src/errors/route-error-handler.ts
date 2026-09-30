import type {
  FastifyToabRouteErrorContext,
} from "@csi-foxbyte/fastify-toab";
import { AppError } from "./app-error.js";
import { recordRequestError } from "../lib/request-logging.js";

export function routeErrorHandler(ctx: FastifyToabRouteErrorContext): void {
  const appError = AppError.fromUnknown(ctx.error);
  const includeStack = process.env.NODE_ENV === "development";

  // onResponse emits one safe record. Never pass the raw error to a logger.
  recordRequestError(ctx.request, ctx.error);

  ctx.reply.code(appError.code).send(appError.toResponse(includeStack));
}
