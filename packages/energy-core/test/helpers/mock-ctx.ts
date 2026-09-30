import type { ResolverContext } from "../../src/engine/types.js";
import type { DETCalculatorContext, DETCalculatorRegistry } from "../../src/calculators/energy/index.js";
import type { DETHeatInput } from "../../src/types/input/heat.js";
import type { PreRenovationValues } from "../../src/types/input/preRenovation.js";

type Ctx = ResolverContext<DETCalculatorContext, DETCalculatorRegistry>;

export function mockCtx(
  heat: DETHeatInput = {},
  resolverMocks: Partial<DETCalculatorRegistry> = {},
  preRenovationValues?: PreRenovationValues | null,
): Ctx {
  return {
    input: {
      config: {} as DETCalculatorContext["config"],
      input: { heat, preRenovationValues } as DETCalculatorContext["input"],
    },
    get(key) {
      if (Object.prototype.hasOwnProperty.call(resolverMocks, key)) {
        return (resolverMocks as Record<string, unknown>)[key as string] as DETCalculatorRegistry[typeof key];
      }
      throw new Error(`Unexpected ctx.get("${String(key)}")`);
    },
    getAll() {
      return resolverMocks as Partial<DETCalculatorRegistry>;
    },
  };
}
