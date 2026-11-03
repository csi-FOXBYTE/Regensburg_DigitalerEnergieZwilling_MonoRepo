import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSubsidies, serializeSubsidies } from "../src/lib/subsidies.ts";

const first = { subsidy: { title: "BEG Einzelmaßnahmen" }, isActive: true };
const second = { subsidy: { title: "KfW 261" }, isActive: false };

describe("subsidy config format", () => {
  it("saves all entries as one JSON array, like the backend default", () => {
    const saved = serializeSubsidies([first, second]);
    assert.equal(saved.length, 1);
    assert.deepEqual(JSON.parse(saved[0]), [first, second]);
  });

  it("loads what it saved", () => {
    assert.deepEqual(parseSubsidies(serializeSubsidies([first, second])), [
      first,
      second,
    ]);
  });

  it("loads configs saved by older versions with one string per entry", () => {
    assert.deepEqual(
      parseSubsidies([JSON.stringify(first), JSON.stringify(second)]),
      [first, second],
    );
  });

  it("loads an empty config", () => {
    assert.deepEqual(parseSubsidies(serializeSubsidies([])), []);
    assert.deepEqual(parseSubsidies([]), []);
  });
});
