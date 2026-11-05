import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAllowedSubsidyHref,
  parseSubsidies,
  serializeSubsidies,
} from "../src/lib/subsidies.ts";

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

describe("subsidy links", () => {
  it("allows absolute https links", () => {
    assert.equal(isAllowedSubsidyHref("https://www.kfw.de/261"), true);
    assert.equal(isAllowedSubsidyHref("HTTPS://www.bafa.de/DE"), true);
  });

  it("rejects other schemes, relative and malformed links", () => {
    for (const href of [
      "javascript:alert(1)",
      "data:text/html,x",
      "file:///C:/Windows/win.ini",
      "smb://attacker.example/share",
      "\\\\attacker.example\\share",
      "http://www.kfw.de/261",
      "//attacker.example/x",
      "/de/foerderung",
      "www.kfw.de",
      " https://www.kfw.de",
      "https://",
      "",
    ]) {
      assert.equal(isAllowedSubsidyHref(href), false, JSON.stringify(href));
    }
  });
});
