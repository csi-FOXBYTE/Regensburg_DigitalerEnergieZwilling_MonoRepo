import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isBasementHeated } from "../../src/calculators/energy/resolvers/buildingInputs.js";
import { numberOfStories } from "../../src/calculators/energy/resolvers/buildingGeometry.js";
import { exteriorWallWindowsArea } from "../../src/calculators/energy/resolvers/exteriorWallWindows/exteriorWallWindowsInputs.js";
import { outerWallHeatLoss } from "../../src/calculators/energy/resolvers/outerWall/outerWallHeatLoss.js";
import { outerWallArea } from "../../src/calculators/energy/resolvers/outerWall/outerWallInputs.js";
import { roofHeatLoss } from "../../src/calculators/energy/resolvers/roof/roofHeatLoss.js";
import type {
  DETCalculatorContext,
  DETCalculatorRegistry,
} from "../../src/calculators/energy/index.js";
import type { ResolverContext } from "../../src/engine/index.js";
import type { DETConfig } from "../../src/types/config/index.js";
import type { DETInput } from "../../src/types/input/index.js";

type Context = ResolverContext<DETCalculatorContext, DETCalculatorRegistry>;

function mockContext(
  input: Partial<Record<keyof DETInput, unknown>> = {},
  config: Partial<Record<keyof DETConfig, unknown>> = {},
  values: Partial<DETCalculatorRegistry> = {},
): Context {
  return {
    input: {
      input: input as DETInput,
      config: config as DETConfig,
    },
    get(key) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return values[key] as DETCalculatorRegistry[typeof key];
      }
      throw new Error(`Unexpected ctx.get("${String(key)}")`);
    },
    getAll() {
      return values;
    },
  };
}

describe("calculator input safeguards", () => {
  describe("numberOfStories", () => {
    test("clamps an inferred zero-story result to one", () => {
      const result = numberOfStories.resolve(
        mockContext(
          { general: {} },
          { general: { assumedInteriorStoryHeight: 2.5 } },
          {
            lowestEaveHeight: 0.5,
            floorSlabThickness: 0.3,
          },
        ),
      );

      assert.equal(result, 1);
    });

    test("preserves a valid inferred story count", () => {
      const result = numberOfStories.resolve(
        mockContext(
          { general: {} },
          { general: { assumedInteriorStoryHeight: 2.5 } },
          {
            buildingHeight: 12,
            lowestEaveHeight: 6,
            floorSlabThickness: 0.3,
          },
        ),
      );

      assert.equal(result, 2);
    });

    test("leaves an explicit story count for the validator to assess", () => {
      const result = numberOfStories.resolve(mockContext({ general: { numberOfStories: 0 } }));

      assert.equal(result, 0);
    });
  });

  describe("outerWallArea", () => {
    test("preserves an explicitly supplied total wall area", () => {
      const result = outerWallArea.resolve(
        mockContext(
          { outerWall: { area: 250 } },
          {},
          {
            outerWallAreaWithoutAttic: 180,
            outerWallAtticArea: 20,
            isAtticHeated: true,
          },
        ),
      );

      assert.equal(result, 250);
    });

    test("uses only the wall without attic when the attic is not heated", () => {
      const result = outerWallArea.resolve(
        mockContext(
          { outerWall: {} },
          {},
          {
            outerWallAreaWithoutAttic: 180,
            outerWallAtticArea: 20,
            isAtticHeated: false,
          },
        ),
      );

      assert.equal(result, 180);
    });

    test("adds the attic wall when the attic is heated", () => {
      const result = outerWallArea.resolve(
        mockContext(
          { outerWall: {} },
          {},
          {
            outerWallAreaWithoutAttic: 180,
            outerWallAtticArea: 20,
            isAtticHeated: true,
          },
        ),
      );

      assert.equal(result, 200);
    });
  });

  describe("outerWallHeatLoss", () => {
    test("subtracts windows but not adjacent-wall overlap", () => {
      const result = outerWallHeatLoss.resolve(
        mockContext({}, {}, {
          adjacentWallArea: 10,
          outerWallArea: 100,
          exteriorWallWindowsArea: 20,
          outerWallUValue: 2,
          outerWallHeatLossFactor: 0.5,
        }),
      );

      assert.equal(result, 80);
    });

    test("clamps a negative opaque wall area to zero", () => {
      const result = outerWallHeatLoss.resolve(
        mockContext({}, {}, {
          adjacentWallArea: 30,
          outerWallArea: 100,
          exteriorWallWindowsArea: 110,
          outerWallUValue: 2,
          outerWallHeatLossFactor: 0.5,
        }),
      );

      assert.equal(result, 0);
    });
  });

  describe("exteriorWallWindowsArea", () => {
    test("estimates area from the wall area without subtracting overlap", () => {
      const result = exteriorWallWindowsArea.resolve(
        mockContext(
          { exteriorWallWindows: {} },
          { windows: { exteriorWallAreaFactor: 0.2 } },
          { outerWallArea: 100, adjacentWallArea: 10 },
        ),
      );

      assert.equal(result, 20);
    });

    test("ignores adjacent wall area when estimating windows", () => {
      const result = exteriorWallWindowsArea.resolve(
        mockContext(
          { exteriorWallWindows: {} },
          { windows: { exteriorWallAreaFactor: 0.2 } },
          { outerWallArea: 100, adjacentWallArea: 110 },
        ),
      );

      assert.equal(result, 20);
    });

    test("clamps a negative estimated area to zero", () => {
      const result = exteriorWallWindowsArea.resolve(
        mockContext(
          { exteriorWallWindows: {} },
          { windows: { exteriorWallAreaFactor: 0.2 } },
          { outerWallArea: -100, adjacentWallArea: 0 },
        ),
      );

      assert.equal(result, 0);
    });

    test("preserves an explicitly supplied area", () => {
      const result = exteriorWallWindowsArea.resolve(
        mockContext({ exteriorWallWindows: { area: 12 } }),
      );

      assert.equal(result, 12);
    });
  });

  describe("roofHeatLoss", () => {
    test("subtracts roof-window area from gross roof area", () => {
      const result = roofHeatLoss.resolve(
        mockContext({}, {}, {
          isSpaceBelowRoofHeated: true,
          roofHeatLossFactor: 0.5,
          roofUValue: 2,
          roofArea: 120,
          roofWindowsArea: 20,
        }),
      );

      assert.equal(result, 100);
    });

    test("clamps a negative opaque roof area to zero", () => {
      const result = roofHeatLoss.resolve(
        mockContext({}, {}, {
          isSpaceBelowRoofHeated: true,
          roofHeatLossFactor: 0.5,
          roofUValue: 2,
          roofArea: 20,
          roofWindowsArea: 30,
        }),
      );

      assert.equal(result, 0);
    });
  });

  describe("isBasementHeated", () => {
    test("resolves false when no basement exists", () => {
      const result = isBasementHeated.resolve(
        mockContext({ bottomFloor: { isBasementHeated: true } }, {}, { hasBasement: false }),
      );

      assert.equal(result, false);
    });

    test("preserves a heated state when a basement exists", () => {
      const result = isBasementHeated.resolve(
        mockContext({ bottomFloor: { isBasementHeated: true } }, {}, { hasBasement: true }),
      );

      assert.equal(result, true);
    });
  });
});
