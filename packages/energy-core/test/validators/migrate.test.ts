import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  detectMigrations,
  validateAndMigrate,
  applyMigrators,
  ConfigMigrationError,
  type ConfigMigrator,
} from "../../src/validators/index.js";
import { baseConfig } from "./fixtures.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";

const MISSING_RECOMMENDED = {
  path: "renovation.heatingSurfaceRenovations.0.recommendedForSystems",
  message: "Required",
};

const MISSING_HEATING_RENOVATION_LABEL_TEMPLATES = {
  path: "renovation.heatingRenovationLabelTemplates",
  message: "Required",
};

const MISSING_ROOF_SHAPE_CONSTRUCTION_DEFAULTS = {
  path: "roof.defaultConstructionTypeByIsFlatRoof",
  message: "Required",
};

const MISSING_DEFAULT_IS_FLAT_ROOF = {
  path: "roof.defaultIsFlatRoof",
  message: "Required",
};

const MISSING_ROOF_SHAPE_ATTIC_DEFAULTS = {
  path: "topFloor.defaultHasAtticByIsFlatRoof",
  message: "Required",
};

const MISSING_DEFAULT_IS_ATTIC_HEATED = {
  path: "topFloor.defaultIsAtticHeated",
  message: "Required",
};

// ── detectMigrations ──────────────────────────────────────────────────────────

describe("detectMigrations", () => {
  test("returns migrator when all issues are recommendedForSystems", () => {
    const result = detectMigrations({}, [MISSING_RECOMMENDED]);
    assert.strictEqual(result.length, 1);
    const migrator = result[0];
    assert.ok(migrator);
    assert.strictEqual(migrator.id, "add-recommended-for-systems");
  });

  test("deduplicates — same migrator returned once for multiple matching issues", () => {
    const issues = [
      { path: "renovation.heatingSurfaceRenovations.0.recommendedForSystems", message: "Required" },
      { path: "renovation.heatingSurfaceRenovations.1.recommendedForSystems", message: "Required" },
    ];
    const result = detectMigrations({}, issues);
    assert.strictEqual(result.length, 1);
  });

  test("returns the label-template migrator for a missing template config", () => {
    const result = detectMigrations({}, [MISSING_HEATING_RENOVATION_LABEL_TEMPLATES]);
    assert.deepStrictEqual(
      result.map((migrator) => migrator.id),
      ["add-heating-renovation-label-templates"],
    );
  });

  test("returns both migrators when both additions are missing", () => {
    const result = detectMigrations({}, [
      MISSING_RECOMMENDED,
      MISSING_HEATING_RENOVATION_LABEL_TEMPLATES,
    ]);
    assert.deepStrictEqual(
      result.map((migrator) => migrator.id),
      ["add-recommended-for-systems", "add-heating-renovation-label-templates"],
    );
  });

  test("returns one roof-shape migrator for all missing roof-shape defaults", () => {
    const result = detectMigrations({}, [
      MISSING_DEFAULT_IS_FLAT_ROOF,
      MISSING_ROOF_SHAPE_CONSTRUCTION_DEFAULTS,
      MISSING_ROOF_SHAPE_ATTIC_DEFAULTS,
      MISSING_DEFAULT_IS_ATTIC_HEATED,
    ]);
    assert.deepStrictEqual(
      result.map((migrator) => migrator.id),
      ["add-roof-shape-defaults"],
    );
  });

  test("returns empty when any issue is not fixable", () => {
    const issues = [
      MISSING_RECOMMENDED,
      { path: "heat.defaultPrimaryEnergyCarrier", message: "not in primaryEnergyCarriers" },
    ];
    assert.strictEqual(detectMigrations({}, issues).length, 0);
  });

  test("returns empty for empty issues list", () => {
    assert.strictEqual(detectMigrations({}, []).length, 0);
  });
});

// ── add-recommended-for-systems migrator (via detectMigrations) ───────────────

describe("add-recommended-for-systems migrator", () => {
  function getMigrator() {
    const migrators = detectMigrations({}, [MISSING_RECOMMENDED]);
    const migrator = migrators[0];
    assert.ok(migrator);
    return migrator;
  }

  test("sets empty array for unknown surface type", () => {
    const raw = {
      heat: { heatingSystemTypes: [{ value: "boiler" }] },
      renovation: {
        heatingSurfaceRenovations: [{ targetSurfaceType: "unknown_surface" }],
      },
    };
    const result = getMigrator().migrate(raw) as any;
    assert.deepStrictEqual(
      result.renovation.heatingSurfaceRenovations[0].recommendedForSystems,
      [],
    );
  });

  test("sets default systems for known surface type", () => {
    const raw = {
      heat: {
        heatingSystemTypes: [
          { value: "air_source_heat_pump_lt_40" },
          { value: "ground_source_heat_pump_lt_40" },
          { value: "boiler" },
        ],
      },
      renovation: {
        heatingSurfaceRenovations: [{ targetSurfaceType: "radiant_surface_heating" }],
      },
    };
    const result = getMigrator().migrate(raw) as any;
    assert.deepStrictEqual(
      result.renovation.heatingSurfaceRenovations[0].recommendedForSystems,
      ["air_source_heat_pump_lt_40", "ground_source_heat_pump_lt_40"],
    );
  });

  test("filters default systems to those present in config", () => {
    const raw = {
      heat: {
        heatingSystemTypes: [{ value: "air_source_heat_pump_lt_40" }],
      },
      renovation: {
        heatingSurfaceRenovations: [{ targetSurfaceType: "radiant_surface_heating" }],
      },
    };
    const result = getMigrator().migrate(raw) as any;
    assert.deepStrictEqual(
      result.renovation.heatingSurfaceRenovations[0].recommendedForSystems,
      ["air_source_heat_pump_lt_40"],
    );
  });

  test("skips entries that already have recommendedForSystems", () => {
    const raw = {
      heat: { heatingSystemTypes: [] },
      renovation: {
        heatingSurfaceRenovations: [
          { targetSurfaceType: "radiant_surface_heating", recommendedForSystems: ["existing"] },
        ],
      },
    };
    const result = getMigrator().migrate(raw) as any;
    assert.deepStrictEqual(
      result.renovation.heatingSurfaceRenovations[0].recommendedForSystems,
      ["existing"],
    );
  });
});

// ── add-heating-renovation-label-templates migrator ──────────────────────────

describe("add-heating-renovation-label-templates migrator", () => {
  function getMigrator() {
    const migrators = detectMigrations({}, [
      MISSING_HEATING_RENOVATION_LABEL_TEMPLATES,
    ]);
    const migrator = migrators[0];
    assert.ok(migrator);
    return migrator;
  }

  test("adds a copy of the default templates", () => {
    const raw = { renovation: {} };
    const result = getMigrator().migrate(raw) as any;

    assert.deepStrictEqual(
      result.renovation.heatingRenovationLabelTemplates,
      DEFAULT_CONFIG.renovation.heatingRenovationLabelTemplates,
    );
    assert.notStrictEqual(
      result.renovation.heatingRenovationLabelTemplates,
      DEFAULT_CONFIG.renovation.heatingRenovationLabelTemplates,
    );
  });

  test("does not overwrite existing templates", () => {
    const templates = {
      carrierAndSystem: { de: "custom-both" },
      carrierOnly: { de: "custom-carrier" },
      systemOnly: { de: "custom-system" },
    };
    const raw = {
      renovation: { heatingRenovationLabelTemplates: templates },
    };

    const result = getMigrator().migrate(raw) as any;
    assert.strictEqual(
      result.renovation.heatingRenovationLabelTemplates,
      templates,
    );
  });
});

// ── add-roof-shape-defaults migrator ─────────────────────────────────────────

describe("add-roof-shape-defaults migrator", () => {
  test("preserves legacy behavior for configs without roof-shape defaults", () => {
    const raw = structuredClone(baseConfig()) as any;
    raw.roof.defaultConstructionType = "rafter";
    delete raw.roof.defaultIsFlatRoof;
    delete raw.roof.defaultConstructionTypeByIsFlatRoof;
    delete raw.topFloor.defaultHasAtticByIsFlatRoof;
    delete raw.topFloor.defaultIsAtticHeated;

    const result = validateAndMigrate(raw);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.migrated, true);
    if (!result.success) return;
    assert.strictEqual(result.data.roof.defaultIsFlatRoof, false);
    assert.deepStrictEqual(result.data.roof.defaultConstructionTypeByIsFlatRoof, [
      { key: true, value: "rafter" },
      { key: false, value: "rafter" },
    ]);
    assert.deepStrictEqual(result.data.topFloor.defaultHasAtticByIsFlatRoof, [
      { key: true, value: false },
      { key: false, value: false },
    ]);
    assert.strictEqual(result.data.topFloor.defaultIsAtticHeated, false);
  });
});

// ── validateAndMigrate ────────────────────────────────────────────────────────

describe("validateAndMigrate", () => {
  test("returns success, migrated:false for already valid config", () => {
    const result = validateAndMigrate(baseConfig());
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.migrated, false);
  });

  test("migrates missing recommendedForSystems and returns success, migrated:true", () => {
    const raw = structuredClone(baseConfig()) as any;
    delete raw.renovation.heatingSurfaceRenovations[0].recommendedForSystems;
    const result = validateAndMigrate(raw);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.migrated, true);
  });

  test("migrates missing heatingRenovationLabelTemplates", () => {
    const raw = structuredClone(baseConfig()) as any;
    delete raw.renovation.heatingRenovationLabelTemplates;

    const result = validateAndMigrate(raw);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.migrated, true);
    if (!result.success) return;
    assert.deepStrictEqual(
      result.data.renovation.heatingRenovationLabelTemplates,
      DEFAULT_CONFIG.renovation.heatingRenovationLabelTemplates,
    );
  });

  test("migrates templates and recommended systems together", () => {
    const raw = structuredClone(baseConfig()) as any;
    delete raw.renovation.heatingRenovationLabelTemplates;
    delete raw.renovation.heatingSurfaceRenovations[0].recommendedForSystems;

    const result = validateAndMigrate(raw);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.migrated, true);
  });

  test("returns failure, migrated:false for non-migratable errors", () => {
    const raw = structuredClone(baseConfig()) as any;
    raw.heat.defaultPrimaryEnergyCarrier = "nonexistent";
    const result = validateAndMigrate(raw);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.migrated, false);
  });

  test("full DEFAULT_CONFIG without recommendedForSystems migrates successfully", () => {
    const raw = structuredClone(DEFAULT_CONFIG) as any;
    for (const entry of raw.renovation.heatingSurfaceRenovations) {
      delete entry.recommendedForSystems;
    }
    const result = validateAndMigrate(raw);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.migrated, true);
    if (!result.success) return;
    for (const entry of result.data.renovation.heatingSurfaceRenovations) {
      assert.ok(Array.isArray(entry.recommendedForSystems), `${entry.targetSurfaceType} missing recommendedForSystems`);
    }
    const radiant = result.data.renovation.heatingSurfaceRenovations.find(
      (e) => e.targetSurfaceType === "radiant_surface_heating",
    );
    assert.ok(radiant);
    assert.deepStrictEqual(radiant.recommendedForSystems, [
      "air_source_heat_pump_55_45",
      "air_source_heat_pump_lt_40",
      "ground_source_heat_pump_55_45",
      "ground_source_heat_pump_lt_40",
      "gas_heat_pump_hybrid",
    ]);
  });
});

// ── applyMigrators / ConfigMigrationError ─────────────────────────────────────

describe("applyMigrators", () => {
  test("threads each migrator's output into the next", () => {
    const a: ConfigMigrator = {
      id: "a",
      canFix: () => true,
      migrate: (raw) => ({ ...(raw as Record<string, unknown>), a: true }),
    };
    const b: ConfigMigrator = {
      id: "b",
      canFix: () => true,
      migrate: (raw) => ({ ...(raw as Record<string, unknown>), b: true }),
    };
    assert.deepStrictEqual(applyMigrators({}, [a, b]), { a: true, b: true });
  });

  test("returns the input unchanged when no migrators are given", () => {
    const raw = { untouched: true };
    assert.strictEqual(applyMigrators(raw, []), raw);
  });

  test("wraps a throwing migrator in ConfigMigrationError with id and cause", () => {
    const boom: ConfigMigrator = {
      id: "boom",
      canFix: () => true,
      migrate: () => {
        throw new TypeError("x.map is not a function");
      },
    };
    assert.throws(
      () => applyMigrators({}, [boom]),
      (err: unknown) => {
        assert.ok(err instanceof ConfigMigrationError);
        assert.ok(err instanceof Error);
        assert.strictEqual(err.migratorId, "boom");
        assert.match(err.message, /boom/);
        assert.match(err.message, /x\.map is not a function/);
        assert.ok(err.cause instanceof TypeError);
        return true;
      },
    );
  });

  test("names the failing migrator even when an earlier one succeeded", () => {
    const ok: ConfigMigrator = {
      id: "ok",
      canFix: () => true,
      migrate: (raw) => raw,
    };
    const bad: ConfigMigrator = {
      id: "bad",
      canFix: () => true,
      migrate: () => {
        throw new Error("nope");
      },
    };
    assert.throws(
      () => applyMigrators({}, [ok, bad]),
      (err: unknown) =>
        err instanceof ConfigMigrationError && err.migratorId === "bad",
    );
  });
});
