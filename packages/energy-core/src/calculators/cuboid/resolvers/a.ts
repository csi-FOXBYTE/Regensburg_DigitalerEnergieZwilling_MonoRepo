import type { Resolver } from "../../../engine/index.js";
import type { CuboidContext, CuboidRegistry } from "../registry.js";

declare module "../registry.js" {
  interface CuboidRegistry {
    a: number;
  }
}

export default {
  key: "a",
  resolve: (ctx) => ctx.input.a,
} satisfies Resolver<CuboidContext, CuboidRegistry, "a">;
