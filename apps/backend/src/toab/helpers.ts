// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/helpers.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { setRequestContext } from "./context.js";
import type {
  ControllerRegistry,
  HandlerOpts,
  HTTPMethods,
} from "./controller.js";
import type { ServiceContainer, ServiceRegistry } from "./service.js";
import {
  fastifyGenericErrorResponsesRefs,
  fastifyGenericErrorResponsesSchemas,
} from "./errors.js";
import type { AnyMiddleware, MiddlewareContext } from "./middleware.js";
import type { FastifyToabRouteErrorHandler } from "./routeError.js";

export type FastifyToabOptions = {
  getRegistries: () => Promise<{
    controllerRegistry: ControllerRegistry;
    serviceRegistry: ServiceRegistry;
  }>;
  globalMiddlewares?: readonly AnyMiddleware[];
  onRouteError?: FastifyToabRouteErrorHandler;
  includeGenericErrorResponses?: boolean;
};

function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === "string") return new Error(e);

  return new Error(`Unexpected non-error value thrown: ${String(e)}`);
}

// The original logged the raw exception here, before onRouteError. Route
// errors are recorded by onRouteError and the request log instead, so no
// message, stack or cause reaches a log record.
async function handleRouteError(
  e: unknown,
  fastify: FastifyInstance,
  composedPath: string,
  request: FastifyRequest,
  reply: FastifyReply,
  onRouteError?: FastifyToabRouteErrorHandler
) {
  if (onRouteError) {
    await onRouteError({
      error: e,
      fastify,
      composedPath,
      request,
      reply,
    });
  }

  if (reply.sent) return;

  throw toError(e);
}

function composeMiddlewares(
  middlewares: readonly AnyMiddleware[]
): (
  ctx: MiddlewareContext,
  request: FastifyRequest,
  reply: FastifyReply,
  services: ServiceContainer,
) => Promise<MiddlewareContext> {
  return async (initialCtx, request, reply, services) => {
    let index = -1;
    let finalCtx = initialCtx;

    const dispatch = async (
      i: number,
      ctx: MiddlewareContext
    ): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }

      index = i;
      finalCtx = ctx;

      const fn = middlewares[i];
      if (!fn) return;

      await fn({ ctx, request, reply, services }, (nextCtx) =>
        dispatch(i + 1, nextCtx.ctx)
      );
    };

    await dispatch(0, initialCtx);
    return finalCtx;
  };
}

/**
 * Fastify plugin that registers all controllers and routes of the registries.
 */
export const fastifyToab: FastifyPluginAsync<FastifyToabOptions> = async (
  fastify,
  {
    getRegistries,
    globalMiddlewares = [],
    onRouteError,
    includeGenericErrorResponses = false,
  }
) => {
  if (includeGenericErrorResponses) {
    for (const schema of Object.values(fastifyGenericErrorResponsesSchemas)) {
      fastify.addSchema(schema);
    }
  }

  const genericErrorResponses = includeGenericErrorResponses
    ? fastifyGenericErrorResponsesRefs
    : {};

  const { controllerRegistry, serviceRegistry } = await getRegistries();

  await serviceRegistry.initializeInstant();

  // A route that fails to register stops startup. The original logged the
  // error and continued without the route.
  for (const controller of controllerRegistry.controllers.values()) {
    for (const [method, routes] of Object.entries(controller.routes)) {
      for (const [path, route] of Object.entries(routes)) {
        const middlewareChain = composeMiddlewares([
          ...globalMiddlewares,
          ...controller.middlewares,
          ...route.middlewares,
        ]);

        const composedPath = `${controller.rootPath}${path === "/" ? "" : path}`;
        const payload = [
          composedPath,
          {
            ...route.opts,
            schema: {
              ...route.opts?.schema,
              tags: [controller.rootPath.substring(1)],
              ...(route.body ? { body: route.body } : {}),
              ...(route.params ? { params: route.params } : {}),
              ...(route.querystring ? { querystring: route.querystring } : {}),
              ...(route.headers ? { headers: route.headers } : {}),
              response: route.output
                ? {
                  200: route.output,
                  ...genericErrorResponses,
                }
                : {
                  204: {},
                  ...genericErrorResponses,
                },
            },
          },
          async (request: FastifyRequest, reply: FastifyReply) => {
            try {
              setRequestContext({ request, reply });

              const ctx = await middlewareChain(
                {},
                request,
                reply,
                serviceRegistry.resolve(),
              );

              const abortController = new AbortController();

              request.raw.on("close", () => {
                abortController.abort("User disconnect.");
              });

              const handlerOpts = createHandlerOpts({
                ctx,
                reply,
                request,
                serviceRegistry,
                signal: abortController.signal,
              });

              const result = await route.handler(handlerOpts);

              if (result === undefined) return reply.raw.end();

              return result;
            } catch (e) {
              return handleRouteError(
                e,
                fastify,
                composedPath,
                request,
                reply,
                onRouteError
              );
            }
          },
        ] as const;

        switch (method as HTTPMethods) {
          case "GET":
            fastify.get(...payload);
            break;
          case "ALL":
            fastify.all(...payload);
            break;
          case "PATCH":
            fastify.patch(...payload);
            break;
          case "DELETE":
            fastify.delete(...payload);
            break;
          case "HEAD":
            fastify.head(...payload);
            break;
          case "POST":
            fastify.post(...payload);
            break;
          case "PUT":
            fastify.put(...payload);
            break;
          default:
            throw new Error(`No handler for "${method}" found.`);
        }
      }
    }
  }
};

function createHandlerOpts({
  ctx,
  serviceRegistry,
  reply,
  request,
  signal,
}: {
  ctx: unknown;
  serviceRegistry: ServiceRegistry;
  reply: FastifyReply;
  request: FastifyRequest;
  signal: AbortSignal;
}): HandlerOpts {
  const path = request.url.split("?")[0] ?? request.url;

  return {
    ctx,
    path,
    reply,
    request,
    services: serviceRegistry.resolve(),
    body: request.body,
    params: request.params,
    querystring: request.query,
    headers: request.headers,
    signal,
  };
}
