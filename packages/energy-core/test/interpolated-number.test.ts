import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  fitLinearRegression,
  InterpolatedNumberSchema,
  resolveInterpolatedNumber,
  type InterpolatedNumber,
} from "../src/types/interpolated-number.js";

const definition: InterpolatedNumber = {
  points: [
    { at: 150, value: 1.47 },
    { at: 500, value: 1.36 },
    { at: 2500, value: 1.28 },
  ],
};

describe("resolveInterpolatedNumber", () => {
  test("returns constant definitions unchanged", () => {
    assert.equal(resolveInterpolatedNumber(1.02, 500), 1.02);
  });

  test("returns exact configured point values", () => {
    assert.equal(resolveInterpolatedNumber(definition, 150), 1.47);
    assert.equal(resolveInterpolatedNumber(definition, 500), 1.36);
    assert.equal(resolveInterpolatedNumber(definition, 2500), 1.28);
  });

  test("interpolates linearly between points", () => {
    assert.equal(resolveInterpolatedNumber(definition, 325), 1.415);
    assert.equal(resolveInterpolatedNumber(definition, 1500), 1.32);
  });

  test("clamps values outside the point range", () => {
    assert.equal(resolveInterpolatedNumber(definition, 0), 1.47);
    assert.equal(resolveInterpolatedNumber(definition, 3000), 1.28);
  });
});

describe("fitLinearRegression", () => {
  test("reconstructs the EFH/ZFH household-electricity coefficients", () => {
    assert.deepEqual(
      fitLinearRegression({
        points: [
          { at: 1, value: 1800 },
          { at: 2, value: 2700 },
          { at: 3, value: 3500 },
          { at: 4, value: 3800 },
          { at: 5, value: 4500 },
        ],
      }),
      { a: 1310, b: 650 },
    );
  });

  test("reconstructs the MFH household-electricity coefficients", () => {
    assert.deepEqual(
      fitLinearRegression({
        points: [
          { at: 1, value: 1200 },
          { at: 2, value: 1900 },
          { at: 3, value: 2400 },
          { at: 4, value: 2600 },
          { at: 5, value: 3100 },
        ],
      }),
      { a: 890, b: 450 },
    );
  });
});

describe("InterpolatedNumberSchema", () => {
  test("requires at least two points", () => {
    assert.equal(InterpolatedNumberSchema.safeParse({ points: [{ at: 150, value: 1.47 }] }).success, false);
  });

  test("requires points to be strictly ascending", () => {
    assert.equal(
      InterpolatedNumberSchema.safeParse({
        points: [
          { at: 500, value: 1.36 },
          { at: 150, value: 1.47 },
        ],
      }).success,
      false,
    );
  });
});
