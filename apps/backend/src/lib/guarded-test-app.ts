import Fastify from "fastify";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceRegistry,
  type WorkerRegistry,
} from "@csi-foxbyte/fastify-toab";
import { requestErrorHandler } from "../errors/request-error-handler.js";
import { routeErrorHandler } from "../errors/route-error-handler.js";
import { installRequestGuards } from "./request-guards.js";
import { installAltchaGuard, type Altcha } from "../altcha/altcha.js";

type Controller = Parameters<ControllerRegistry["register"]>[0];

/**
 * Route-test app wired like startServer() with fastify-toab.config.ts:
 * error handler and request guards first, then the API routes with the
 * generic ERROR_4xx response schemas. Every service resolves to `service`.
 * The Altcha guard is installed only when `altcha` is given.
 */
export async function createGuardedTestApp(
  controllers: Controller[],
  service: object = {},
  { altcha }: { altcha?: Altcha } = {},
) {
  const serviceRegistry = {
    initializeInstant: async () => undefined,
    resolve: () => ({ get: async () => service }),
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  for (const controller of controllers) controllerRegistry.register(controller);

  const app = Fastify();
  app.setErrorHandler(requestErrorHandler);
  installRequestGuards(app);
  if (altcha) installAltchaGuard(app, altcha);
  await app.register(fastifyToab, {
    getRegistries: async () => ({
      controllerRegistry,
      serviceRegistry,
      workerRegistry: {} as WorkerRegistry,
    }),
    includeGenericErrorResponses: true,
    onRouteError: routeErrorHandler,
  });
  await app.ready();
  return app;
}
