// Derived from @csi-foxbyte/fastify-toab 0.2.0-rc.4 (src/service.ts), LGPL-3.0-or-later,
// https://github.com/csi-FOXBYTE/fastify-toab. Modified for this backend, see NOTICE.
import { AsyncLocalStorage } from "node:async_hooks";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getRequestContext } from "./context.js";

type ServiceScope = "REQUEST" | "SINGLETON";
type ServiceBuildTime = "DYNAMIC" | "INSTANT";

type ServiceFactory<T, S extends ServiceScope> = (
  opts: S extends "SINGLETON"
    ? { services: ServiceContainer }
    : { services: ServiceContainer; request: FastifyRequest; reply: FastifyReply }
) => Promise<T>;
type Service<T, S extends ServiceScope> = {
  name: string;
  factory: ServiceFactory<T, S>;
  scope: ServiceScope;
  buildTime: ServiceBuildTime;
};
export type ServiceContainer = {
  /**
   * Resolves a registered service by name.
   */
  get<T>(name: string): Promise<T>;
};

export type InferService<S> = S extends {
  name: string;
  factory: ServiceFactory<infer T, infer _S>;
}
  ? T
  : never;

const resolveLocalStorage = new AsyncLocalStorage<{
  visitedSet: Set<string>;
  resolutionStack: Array<{ name: string; scope: ServiceScope }>;
}>();

/**
 * Registry and resolver for services.
 *
 * @remarks
 * Services are resolved lazily and support singleton and request scopes.
 */
export class ServiceRegistry {
  private readonly factories = new Map<
    string,
    {
      factory: ServiceFactory<any, any>;
      scope: ServiceScope;
      buildTime: ServiceBuildTime;
    }
  >();
  private readonly singletonInstances = new Map<string, any>();

  /**
   * Registers a service definition under its unique name.
   */
  register<T, S extends ServiceScope>({
    name,
    factory,
    scope,
    buildTime,
  }: Service<T, S>): void {
    if (this.factories.has(name)) {
      throw new Error(`Service "${name}" already registered.`);
    }
    this.factories.set(name, { factory, scope, buildTime });
  }

  /**
   * Eagerly resolves all services marked with `buildTime: "INSTANT"`.
   */
  async initializeInstant() {
    for (const [name, { buildTime }] of this.factories.entries()) {
      if (buildTime === "INSTANT") {
        await this.resolve().get(name);
      }
    }
  }

  /**
   * Creates a dependency container for resolving registered services.
   */
  resolve(): ServiceContainer {
    const requestScopedInstances = new Map<string, any>();
    const resolving = new Set<string>();

    const container: ServiceContainer = {
      get: async <T>(name: string): Promise<T> => {
        let store = resolveLocalStorage.getStore();

        if (!store) {
          store = { visitedSet: new Set(), resolutionStack: [] };
          resolveLocalStorage.enterWith(store);
        }

        store.visitedSet.add(name);

        const definition = this.factories.get(name);
        if (!definition) {
          throw new Error(`No service named "${name}" found!`);
        }

        const { factory, scope } = definition;

        const topOfStack =
          store.resolutionStack[store.resolutionStack.length - 1];
        if (scope === "REQUEST" && topOfStack?.scope === "SINGLETON") {
          throw new Error(
            `Request scoped service "${name}" cannot be resolved from singleton service "${topOfStack.name}".`
          );
        }

        const cache =
          scope === "SINGLETON"
            ? this.singletonInstances
            : requestScopedInstances;

        if (cache.has(name)) {
          return cache.get(name);
        }

        if (resolving.has(name)) {
          throw new Error(
            `Circular dependency detected while resolving "${name}"`
          );
        }

        store.resolutionStack.push({ name, scope });
        resolving.add(name);
        try {
          const instance = scope === "REQUEST"
            ? await factory({ services: container, ...getRequestContext() })
            : await factory({ services: container });
          cache.set(name, instance);
          return instance;
        } finally {
          store.resolutionStack.pop();
          resolving.delete(name);
        }
      },
    };

    return container;
  }
}

/**
 * Declares a service that can later be registered in a {@link ServiceRegistry}.
 *
 * @remarks
 * The returned definition is exported from a `*.service.ts` module and picked
 * up by the generated registries.
 */
export function createService<T, S extends ServiceScope>(
  name: string,
  factory: ServiceFactory<T, S>,
  opts?: S extends "SINGLETON"
    ? { scope?: S; buildTime?: ServiceBuildTime }
    : { scope?: S; buildTime?: undefined }
): Service<T, S> {
  return {
    name,
    factory,
    scope: opts?.scope ?? ("SINGLETON" as S),
    buildTime: opts?.buildTime ?? "DYNAMIC",
  };
}
