// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (https://github.com/csi-FOXBYTE/fastify-toab,
// commit c34d141), Copyright csi FOXBYTE, LGPL-3.0-or-later. Vendored and
// modified for this backend; the changes are listed in NOTICE. Code generation
// and the build live in scripts/toab.ts.
export {
  type ControllerC,
  ControllerRegistry,
  createController,
} from "./controller.js";
export {
  type InferService,
  type ServiceContainer,
  ServiceRegistry,
  createService,
} from "./service.js";
export {
  type ConfiguredGlobalMiddlewares,
  type DeclaredGlobalMiddlewareContext,
  type DeclaredGlobalMiddlewares,
  type InferMiddlewareContext,
  createMiddleware,
} from "./middleware.js";
export { type FastifyToabOptions, fastifyToab } from "./helpers.js";
export {
  type FastifyToabRouteErrorContext,
  type FastifyToabRouteErrorHandler,
} from "./routeError.js";
export { getRequestContext, setRequestContext } from "./context.js";
export { defineConfig, resolveConfig } from "./config.js";
export { createFastify, startServer } from "./run.js";
export type { InstrumentationInput } from "./instrumentation.js";
export type {
  FastifyDynamicSwaggerOptions,
  FastifySwaggerUiOptions,
  FastifyToabConfigOptions,
  FastifyToabConfigOptionsResolved,
  Registries,
} from "./config.js";
