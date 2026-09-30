import type { Resolver } from "../../../engine/index.js";
import type { CuboidContext, CuboidRegistry } from "../registry.js";

declare module "../registry.js" {
  interface CuboidRegistry {
    volume: number;
  }
}

export default {
  key: "volume",
  resolve: (ctx) => ctx.get("a") * ctx.get("b") * ctx.get("c"),
} satisfies Resolver<CuboidContext, CuboidRegistry, "volume">;
