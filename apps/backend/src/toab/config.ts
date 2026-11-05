// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/config.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { FastifyBaseLogger, FastifyInstance, FastifyListenOptions } from "fastify";
import type { LevelWithSilent } from "pino";
import type { InputOptions, OutputOptions, RolldownPluginOption } from "rolldown";
import type { FastifyCorsOptions } from "@fastify/cors";
import type { FastifyHelmetOptions } from "@fastify/helmet";
import type { FastifyMultipartOptions } from "@fastify/multipart";
import type { FastifyUnderPressureOptions } from "@fastify/under-pressure";
import type { TObject, TOptional, TString } from "@sinclair/typebox";
import type { ControllerRegistry } from "./controller.js";
import type { AnyMiddleware } from "./middleware.js";
import type { FastifyToabRouteErrorHandler } from "./routeError.js";
import type { ServiceRegistry } from "./service.js";

type ToggleablePluginOptions<T> = T & { enabled?: boolean };

export type FastifyDynamicSwaggerOptions = Extract<
  Parameters<typeof import("@fastify/swagger").default>[1],
  { mode?: "dynamic" }
>;
export type FastifySwaggerUiOptions =
  Parameters<typeof import("@fastify/swagger-ui").default>[1];

export type Registries = {
  serviceRegistry: ServiceRegistry;
  controllerRegistry: ControllerRegistry;
};

export type FastifyToabResolveOpts = Readonly<{
  isDev: boolean;
  name: string;
  version: string;
  cwd: string;
  rootDir: string;
}>;

export type FastifyToabConfigOptions = {
  env: TObject<Record<string, TString | TOptional<TString>>>;
  /**
   * Logger of the Fastify instance (`fastify.log`, `request.log`). Without
   * one, Fastify does not log. Fastify's own request and error records are
   * always off; the application logs requests itself.
   */
  logger?: FastifyBaseLogger;
  onReady?: (fastify: FastifyInstance, registries: Registries) => Promise<void>;
  onPreStart?: (fastify: FastifyInstance, registries: Registries) => Promise<void>;
  fastify?: (opts: FastifyToabResolveOpts) => {
    cors?: ToggleablePluginOptions<FastifyCorsOptions>;
    helmet?: ToggleablePluginOptions<FastifyHelmetOptions>;
    swagger?: ToggleablePluginOptions<FastifyDynamicSwaggerOptions>;
    swaggerUi?: ToggleablePluginOptions<FastifySwaggerUiOptions>;
    multipart?: ToggleablePluginOptions<FastifyMultipartOptions>;
    underPressure?: ToggleablePluginOptions<FastifyUnderPressureOptions>;
  };
  server?: {
    fastify?: {
      listen?: FastifyListenOptions;
    };
  };
  globalMiddlewares?: readonly AnyMiddleware[];
  rootDir?: string;
  includeGenericErrorResponses?: boolean;
  onRouteError?: FastifyToabRouteErrorHandler;
  logLevel?: LevelWithSilent;
  prefix?: string;
  /** Build options, read by scripts/toab.ts only. */
  rolldown?: {
    inputObject?: Record<string, string>;
    plugins?: RolldownPluginOption[];
    external?: string[];
    output?: Omit<OutputOptions, "dir" | "format" | "cleanDir" | "strict" | "esModule" | "codeSplitting" | "preserveModules" | "banner">;
  } & Omit<InputOptions, "input" | "platform" | "plugins" | "external">;
};

export interface FastifyToabConfigOptionsResolved extends Omit<FastifyToabConfigOptions, "fastify" | "server"> {
  rootDir: string;
  workDir: string;
  logLevel: LevelWithSilent;
  includeGenericErrorResponses: boolean;
  server: {
    fastify: {
      listen: FastifyListenOptions;
    };
  };
  fastify: {
    cors: FastifyCorsOptions & { enabled: boolean };
    helmet: FastifyHelmetOptions & { enabled: boolean };
    swagger: FastifyDynamicSwaggerOptions & { enabled: boolean };
    swaggerUi: FastifySwaggerUiOptions & { enabled: boolean };
    multipart: FastifyMultipartOptions & { enabled: boolean };
    underPressure: FastifyUnderPressureOptions & { enabled: boolean };
  };
}

/**
 * Normalizes a config object into the runtime shape used by startServer().
 *
 * @remarks
 * This applies defaults for the built-in Fastify integrations, the log level
 * and the listen options. It does not register any plugin.
 */
export async function resolveConfig(
  opts: FastifyToabConfigOptions,
  cwd = process.cwd()
): Promise<FastifyToabConfigOptionsResolved> {
  const isDev = process.env.NODE_ENV === "development";

  const packageJsonUrl = pathToFileURL(path.join(cwd, "package.json")).href;
  const { default: pkg } = await import(packageJsonUrl, {
    with: { type: "json" },
  });

  const version = pkg.version;
  const name = pkg.name;
  const rootDir = opts.rootDir ?? "src";

  const fastifyOpts = opts.fastify?.({ isDev, name, version, rootDir, cwd });

  return {
    ...opts,
    logLevel: opts.logLevel ?? (isDev ? "debug" : "info"),
    includeGenericErrorResponses: opts.includeGenericErrorResponses ?? true,
    server: {
      fastify: {
        listen: {
          port: opts.server?.fastify?.listen?.port ?? 5000,
          host: opts.server?.fastify?.listen?.host ?? "0.0.0.0",
          ...opts.server?.fastify?.listen,
        },
      },
    },
    rootDir,
    workDir: path.join(cwd, rootDir),
    fastify: {
      cors: {
        enabled: fastifyOpts?.cors?.enabled ?? !isDev,
        origin: fastifyOpts?.cors?.origin ?? true,
        allowedHeaders: fastifyOpts?.cors?.allowedHeaders ?? ["Content-Type", "Authorization", "X-Requested-With"],
        methods: fastifyOpts?.cors?.methods ?? ["GET", "PUT", "POST", "DELETE", "PATCH"],
      },
      underPressure: {
        enabled: fastifyOpts?.underPressure?.enabled ?? true,
        ...fastifyOpts?.underPressure,
      },
      helmet: {
        enabled: fastifyOpts?.helmet?.enabled ?? true,
        contentSecurityPolicy: fastifyOpts?.helmet?.contentSecurityPolicy ?? (isDev ? false : undefined),
        ...fastifyOpts?.helmet,
      },
      swagger: {
        enabled: fastifyOpts?.swagger?.enabled ?? isDev,
        openapi: {
          info: {
            title: name,
            version: version,
            ...fastifyOpts?.swagger?.openapi?.info,
          },
          ...fastifyOpts?.swagger?.openapi,
        },
      },
      swaggerUi: {
        enabled: fastifyOpts?.swaggerUi?.enabled ?? isDev,
        routePrefix: fastifyOpts?.swaggerUi?.routePrefix ?? "/docs",
        ...fastifyOpts?.swaggerUi,
      },
      multipart: {
        enabled: fastifyOpts?.multipart?.enabled ?? true,
        ...fastifyOpts?.multipart,
      },
    },
  };
}

/**
 * Declares the runtime configuration (fastify-toab.config.ts).
 *
 * @remarks
 * The returned object is also used for type inference by
 * `src/@internals/globals.d.ts`, which augments `FastifyToabGlobals` and
 * `NodeJS.ProcessEnv`.
 */
export function defineConfig<const T extends FastifyToabConfigOptions>(opts: T): T {
  return opts;
}
