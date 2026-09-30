import type { Resolver, ResolverContext } from "./types.js";

const RESOLVING = Symbol("resolving");

export function createCalculator<TContext, TRegistry>(
  resolvers: Array<Resolver<TContext, TRegistry>>,
) {
  const resolverMap = new Map<keyof TRegistry, Resolver<TContext, TRegistry>>(
    resolvers.map((r) => [r.key, r]),
  );

  return (input: TContext): ResolverContext<TContext, TRegistry> => {
    const cache = new Map<
      keyof TRegistry,
      TRegistry[keyof TRegistry] | typeof RESOLVING
    >();

    const ctx: ResolverContext<TContext, TRegistry> = {
      input,
      getAll(): Partial<TRegistry> {
        const result: Partial<TRegistry> = {};
        for (const [key, value] of cache) {
          if (value !== RESOLVING) {
            result[key] = value as TRegistry[typeof key];
          }
        }
        return result;
      },
      get<K extends keyof TRegistry>(key: K): TRegistry[K] {
        const cached = cache.get(key);
        if (cached === RESOLVING) {
          throw new Error(
            `Circular dependency detected for key: ${String(key)}`,
          );
        }
        if (cache.has(key)) {
          return cached as TRegistry[K];
        }

        const resolver = resolverMap.get(key);
        if (!resolver) {
          throw new Error(`No resolver registered for key: ${String(key)}`);
        }

        cache.set(key, RESOLVING);
        let value: TRegistry[K];
        try {
          value = resolver.resolve(ctx) as TRegistry[K];
        } catch (error) {
          cache.delete(key);
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Resolver "${String(key)}" failed: ${message}`, { cause: error });
        }
        cache.set(key, value);
        return value;
      },
    };

    return ctx;
  };
}
