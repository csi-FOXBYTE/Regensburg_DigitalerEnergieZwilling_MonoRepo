import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAvailablePages, getPageForMatches } from "../src/lib/pageAccess.ts";

const userWithRoles = (...roles: string[]) => ({
  resource_access: { "digital-energy-twin": { roles } },
});

describe("page access follows backend permissions", () => {
  for (const [role, expected] of [
    ["admin", ["/dashboard", "/maintenance", "/config"]],
    ["manager", ["/dashboard", "/maintenance"]],
    ["maintainer", ["/config"]],
  ] as const) {
    it(`shows the allowed pages and landing destination for ${role}`, () => {
      assert.deepEqual(
        getAvailablePages(userWithRoles(role)).map((page) => page.path),
        expected,
      );
    });
  }

  it("combines permissions for users with multiple roles without duplicate tabs", () => {
    assert.deepEqual(
      getAvailablePages(userWithRoles("maintainer", "manager", "manager")).map(
        (page) => page.path,
      ),
      ["/dashboard", "/maintenance", "/config"],
    );
  });

  it("grants no pages before authentication or for missing/unknown roles", () => {
    for (const user of [
      null,
      undefined,
      {},
      userWithRoles(),
      userWithRoles("viewer"),
    ]) {
      assert.deepEqual(getAvailablePages(user), []);
    }
  });

  it("ignores admin roles belonging to another client or the realm", () => {
    const user = {
      realm_access: { roles: ["admin"] },
      resource_access: { account: { roles: ["admin"] } },
    };
    assert.deepEqual(getAvailablePages(user), []);
  });

  it("applies the same access rule to the building list and matched record routes", () => {
    for (const routeId of [
      "/_with_header/maintenance/",
      "/_with_header/record/$id/",
    ]) {
      assert.equal(getPageForMatches([{ routeId }]), "/maintenance");
    }
    assert.equal(
      getPageForMatches([{ routeId: "/_with_header/config/" }]),
      "/config",
    );
    assert.equal(
      getPageForMatches([{ routeId: "/_with_header/dashboard/" }]),
      "/dashboard",
    );
  });

  it("leaves unknown paths to the router's not-found handler", () => {
    assert.equal(
      getPageForMatches([
        { routeId: "__root__" },
        { routeId: "/_with_header" },
      ]),
      undefined,
    );
  });
});
