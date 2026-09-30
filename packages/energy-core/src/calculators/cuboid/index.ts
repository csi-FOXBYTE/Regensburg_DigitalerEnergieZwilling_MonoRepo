import { createCalculator } from "../../engine/index.js";
import type { CuboidContext, CuboidRegistry } from "./registry.js";
import a from "./resolvers/a.js";
import b from "./resolvers/b.js";
import c from "./resolvers/c.js";
import volume from "./resolvers/volume.js";
import surface from "./resolvers/surface.js";

export type { CuboidContext, CuboidRegistry };

export const cuboidCalculator = createCalculator<CuboidContext, CuboidRegistry>(
  [a, b, c, volume, surface],
);
