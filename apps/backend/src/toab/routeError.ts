// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/routeError.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type FastifyToabRouteErrorContext = {
  error: unknown;
  fastify: FastifyInstance;
  composedPath: string;
  request: FastifyRequest;
  reply: FastifyReply;
};

export type FastifyToabRouteErrorHandler = (
  ctx: FastifyToabRouteErrorContext
) => Promise<void> | void;
