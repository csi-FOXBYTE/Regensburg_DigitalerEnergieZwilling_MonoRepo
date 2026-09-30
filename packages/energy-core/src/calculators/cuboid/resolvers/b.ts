import type { Resolver } from "../../../engine/index.js";
import type { CuboidContext, CuboidRegistry } from "../registry.js";

declare module "../registry.js" {
  interface CuboidRegistry {
    b: number;
  }
}

export default {
  key: "b",
  resolve: (ctx) => ctx.input.b,
} satisfies Resolver<CuboidContext, CuboidRegistry, "b">;
