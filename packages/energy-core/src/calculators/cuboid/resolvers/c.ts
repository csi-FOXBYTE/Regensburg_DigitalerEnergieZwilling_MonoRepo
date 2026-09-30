import type { Resolver } from "../../../engine/index.js";
import type { CuboidContext, CuboidRegistry } from "../registry.js";

declare module "../registry.js" {
  interface CuboidRegistry {
    c: number;
  }
}

export default {
  key: "c",
  resolve: (ctx) => ctx.input.c,
} satisfies Resolver<CuboidContext, CuboidRegistry, "c">;
