export type ResolverContext<TContext, TRegistry> = {
  readonly input: TContext;
  get<K extends keyof TRegistry>(key: K): TRegistry[K];
  getAll(): Partial<TRegistry>;
};

export type Resolver<
  TContext,
  TRegistry,
  K extends keyof TRegistry = keyof TRegistry,
> = {
  key: K;
  resolve: (ctx: ResolverContext<TContext, TRegistry>) => TRegistry[K];
};
