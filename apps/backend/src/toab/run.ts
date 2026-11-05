// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/run.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import Fastify, { LogController, type FastifyBaseLogger, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import helmet, { type FastifyHelmetOptions } from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import underPressure from "@fastify/under-pressure";
import { AssertError, Value } from "@sinclair/typebox/value";
import {
  type FastifyToabConfigOptions,
  type FastifyToabConfigOptionsResolved,
  type Registries,
  resolveConfig,
} from "./config.js";
import { fastifyToab } from "./helpers.js";
import type { InstrumentationInput } from "./instrumentation.js";

function withoutEnabled<T extends { enabled: boolean }>(
  options: T
): Omit<T, "enabled"> {
  const { enabled: _enabled, ...pluginOptions } = options;

  return pluginOptions;
}

/**
 * Creates the Fastify instance startServer() uses, for tests that wire an app
 * the same way.
 *
 * @remarks
 * Fastify's own request and error records are switched off: they carry the
 * URL, headers and error messages. The application logs requests itself
 * (src/lib/request-logging.ts), and every other record goes through `logger`.
 */
export function createFastify(
  logger?: FastifyBaseLogger,
  options: Omit<FastifyServerOptions, "logger" | "loggerInstance" | "logController" | "disableRequestLogging"> = {},
) {
  return Fastify({
    ...options,
    loggerInstance: logger,
    logController: new LogController({ disableRequestLogging: true }),
  });
}

/**
 * Registers the built-in Fastify integrations from `config.fastify`.
 */
async function registerBuiltInPlugins(
  fastify: ReturnType<typeof createFastify>,
  config: FastifyToabConfigOptionsResolved
) {
  if (config.fastify.cors.enabled) {
    await fastify.register(cors, withoutEnabled(config.fastify.cors));
  }

  if (config.fastify.helmet.enabled) {
    // Omit<> flattens helmet's union of mutually exclusive option names.
    await fastify.register(helmet, withoutEnabled(config.fastify.helmet) as FastifyHelmetOptions);
  }

  if (config.fastify.swagger.enabled) {
    await fastify.register(swagger, withoutEnabled(config.fastify.swagger));
  }

  if (config.fastify.swaggerUi.enabled) {
    await fastify.register(swaggerUi, withoutEnabled(config.fastify.swaggerUi));
  }

  if (config.fastify.multipart.enabled) {
    await fastify.register(multipart, withoutEnabled(config.fastify.multipart));
  }

  if (config.fastify.underPressure.enabled) {
    await fastify.register(underPressure, withoutEnabled(config.fastify.underPressure));
  }
}

// Only the names of the schema's variables, never a value or a message.
function invalidEnvVariables(config: FastifyToabConfigOptions, error: AssertError) {
  const known = new Set(Object.keys(config.env.properties));
  const names = [...error.Errors()].map((err) => err.path.split("/")[1] ?? "");
  return [...new Set(names.filter((name) => known.has(name)))].sort();
}

/**
 * Boots the Fastify server from the registries, instrumentation and config.
 *
 * @remarks
 * Called by the generated `src/@internals/run.ts`. Validates `process.env`
 * against the configured TypeBox schema, resolves config defaults, registers
 * the built-in Fastify plugins and then the controllers.
 */
export async function startServer(
  getRegistries: () => Promise<Registries>,
  instrumentationFn: (input: InstrumentationInput) => Promise<void>,
  config: FastifyToabConfigOptions
) {
  try {
    Value.Assert(config.env, process.env);
  } catch (error) {
    if (!(error instanceof AssertError)) throw error;
    const variables = invalidEnvVariables(config, error);
    if (config.logger) config.logger.fatal({ event: "env_invalid", variables });
    else console.error(`Invalid environment variables: ${variables.join(", ")}`);
    process.exit(1);
  }

  const resolvedConfig = await resolveConfig(config);

  const fastify = createFastify(resolvedConfig.logger);

  const registries = await getRegistries();

  await instrumentationFn({ fastify, registries });

  await registerBuiltInPlugins(fastify, resolvedConfig);

  if (resolvedConfig.onPreStart) {
    await resolvedConfig.onPreStart(fastify, registries);
  }

  fastify.register(fastifyToab, {
    getRegistries: async () => registries,
    globalMiddlewares: resolvedConfig.globalMiddlewares,
    includeGenericErrorResponses: resolvedConfig.includeGenericErrorResponses,
    onRouteError: resolvedConfig.onRouteError,
    logLevel: resolvedConfig.logLevel,
    prefix: resolvedConfig.prefix,
  });

  await fastify.ready();

  if (resolvedConfig.fastify.swagger.enabled) fastify.swagger();

  if (resolvedConfig.onReady) await resolvedConfig.onReady(fastify, registries);

  await fastify.listen(resolvedConfig.server.fastify.listen);
}
