import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatBand,
  getValueForBand,
  sortBands,
  type BandEntry,
} from "../src/lib/buildingTypes.ts";

describe("building type year-band helpers", () => {
  it("finds the value whose range fully contains the requested band", () => {
    const values: BandEntry[] = [
      { to: 1918, value: 1 },
      { from: 1919, to: 1948, value: 2 },
      { from: 1949, value: 3 },
    ];

    assert.equal(getValueForBand(values, { from: 1920, to: 1940 }), 2);
    assert.equal(getValueForBand(values, { from: 1950 }), 3);
    assert.equal(getValueForBand(values, { from: 1900, to: 1950 }), undefined);
  });

  it("sorts bands by their lower bound without mutating the input", () => {
    const bands = [{ from: 1979 }, { to: 1918 }, { from: 1919, to: 1948 }];

    const sorted = sortBands(bands);

    assert.deepEqual(sorted, [bands[1], bands[2], bands[0]]);
    assert.deepEqual(bands, [
      { from: 1979 },
      { to: 1918 },
      { from: 1919, to: 1948 },
    ]);
  });

  it("formats bounded and open-ended bands consistently", () => {
    assert.equal(formatBand({ from: 1919, to: 1948 }), "1919–1948");
    assert.equal(formatBand({ to: 1918 }), "≤ 1918");
    assert.equal(formatBand({ from: 1949 }), "ab 1949");
    assert.equal(formatBand({}), "alle");
  });
});
