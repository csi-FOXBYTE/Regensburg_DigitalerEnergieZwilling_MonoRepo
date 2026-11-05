import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mockSubsidies } from "./config.service.js";
import { findSubsidyLinkIssues, isAllowedSubsidyHref } from "./subsidy-links.js";

const entry = (href?: unknown) => ({
  subsidy: { title: "KfW 261", ...(href === undefined ? {} : { href }) },
  isActive: true,
});

describe("subsidy links", () => {
  it("allows absolute https links", () => {
    for (const href of [
      "https://www.kfw.de/261",
      "HTTPS://www.bafa.de/DE/Energie",
      "https://www.regensburg.de/greendeal?x=1#a",
    ]) {
      assert.equal(isAllowedSubsidyHref(href), true, href);
    }
  });

  it("rejects other schemes, relative and malformed links", () => {
    for (const href of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///C:/Windows/win.ini",
      "file://attacker.example/share",
      "smb://attacker.example/share",
      "\\\\attacker.example\\share",
      "http://www.kfw.de/261",
      "//attacker.example/x",
      "/de/foerderung",
      "www.kfw.de",
      " https://www.kfw.de/261",
      "https://www.kfw.de/2 61",
      "https:\n//www.kfw.de",
      "https://",
    ]) {
      assert.equal(isAllowedSubsidyHref(href), false, JSON.stringify(href));
    }
  });

  it("accepts the default subsidies", () => {
    assert.deepEqual(findSubsidyLinkIssues([JSON.stringify(mockSubsidies)]), []);
  });

  it("accepts entries without a link", () => {
    assert.deepEqual(
      findSubsidyLinkIssues([JSON.stringify([entry(), entry("")])]),
      [],
    );
    assert.deepEqual(findSubsidyLinkIssues([]), []);
  });

  it("checks both stored shapes", () => {
    assert.deepEqual(
      findSubsidyLinkIssues([
        JSON.stringify([entry("https://www.kfw.de/261"), entry("file://x/y")]),
      ]),
      ["subsidies[0][1].subsidy.href: only absolute https:// links are allowed"],
    );
    assert.deepEqual(
      findSubsidyLinkIssues([
        JSON.stringify(entry("https://www.kfw.de/261")),
        JSON.stringify(entry("javascript:alert(1)")),
      ]),
      ["subsidies[1].subsidy.href: only absolute https:// links are allowed"],
    );
  });

  it("rejects non-string links and malformed payloads", () => {
    assert.equal(findSubsidyLinkIssues([JSON.stringify([entry(42)])]).length, 1);
    assert.deepEqual(findSubsidyLinkIssues(["[{"]), [
      "subsidies[0]: not valid JSON",
    ]);
    assert.deepEqual(findSubsidyLinkIssues([JSON.stringify([null])]), [
      "subsidies[0][0]: must be an object",
    ]);
  });
});
