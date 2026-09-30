import type { Resolver } from "../../../engine/index.js";
import type { CuboidContext, CuboidRegistry } from "../registry.js";

declare module "../registry.js" {
  interface CuboidRegistry {
    surface: number;
  }
}

export default {
  key: "surface",
  resolve: (ctx) => {
    const a = ctx.get("a");
    const b = ctx.get("b");
    const c = ctx.get("c");
    return 2 * (a * b + a * c + b * c);
  },
} satisfies Resolver<CuboidContext, CuboidRegistry, "surface">;
