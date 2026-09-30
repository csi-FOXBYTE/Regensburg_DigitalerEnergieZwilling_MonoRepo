import { DEFAULT_CONFIG } from "../types/config/default-config.js";
import { validateConfig } from "./config.js";
import type { ValidationIssue } from "./types.js";
import type { DETConfig } from "../types/config/index.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type ConfigMigrator = {
  id: string;
  canFix: (issue: ValidationIssue) => boolean;
  migrate: (raw: unknown) => unknown;
};

const addRecommendedForSystems: ConfigMigrator = {
  id: "add-recommended-for-systems",
  canFix: (issue) =>
    /^renovation\.heatingSurfaceRenovations\.\d+\.recommendedForSystems$/.test(
      issue.path,
    ),
  migrate: (raw) => {
    if (!isRecord(raw)) return raw;

    const heat = raw.heat;
    const renovation = raw.renovation;

    const heatingSystemTypes = isRecord(heat) ? heat.heatingSystemTypes : undefined;
    const systemTypes: string[] = Array.isArray(heatingSystemTypes)
      ? heatingSystemTypes.flatMap((s) =>
          isRecord(s) && typeof s.value === "string" ? [s.value] : [],
        )
      : [];

    if (!isRecord(renovation)) return raw;
    const hsr = renovation.heatingSurfaceRenovations;
    if (!Array.isArray(hsr)) return raw;

    return {
      ...raw,
      renovation: {
        ...renovation,
        heatingSurfaceRenovations: hsr.map((entry) => {
          if (!isRecord(entry)) return entry;
          if (entry.recommendedForSystems != null) return entry;
          const defaultEntry =
            DEFAULT_CONFIG.renovation.heatingSurfaceRenovations.find(
              (d) => d.targetSurfaceType === entry.targetSurfaceType,
            );
          return {
            ...entry,
            recommendedForSystems: defaultEntry
              ? defaultEntry.recommendedForSystems.filter((s) =>
                  systemTypes.includes(s),
                )
              : [],
          };
        }),
      },
    };
  },
};

const addHeatingRenovationLabelTemplates: ConfigMigrator = {
  id: "add-heating-renovation-label-templates",
  canFix: (issue) =>
    issue.path === "renovation.heatingRenovationLabelTemplates",
  migrate: (raw) => {
    if (!isRecord(raw)) return raw;
    const renovation = raw.renovation;
    if (!isRecord(renovation)) return raw;
    if (renovation.heatingRenovationLabelTemplates != null) return raw;

    const defaults = DEFAULT_CONFIG.renovation.heatingRenovationLabelTemplates;
    return {
      ...raw,
      renovation: {
        ...renovation,
        heatingRenovationLabelTemplates: {
          carrierAndSystem: { ...defaults.carrierAndSystem },
          carrierOnly: { ...defaults.carrierOnly },
          systemOnly: { ...defaults.systemOnly },
        },
      },
    };
  },
};

const addRoofShapeDefaults: ConfigMigrator = {
  id: "add-roof-shape-defaults",
  canFix: (issue) =>
    issue.path === "roof.defaultIsFlatRoof" ||
    issue.path === "roof.defaultConstructionTypeByIsFlatRoof" ||
    issue.path === "topFloor.defaultHasAtticByIsFlatRoof" ||
    issue.path === "topFloor.defaultIsAtticHeated",
  migrate: (raw) => {
    if (!isRecord(raw)) return raw;

    const roof = raw.roof;
    const topFloor = raw.topFloor;
    if (!isRecord(roof) || !isRecord(topFloor)) return raw;

    const defaultConstructionTypeByIsFlatRoof =
      roof.defaultConstructionTypeByIsFlatRoof ??
      (typeof roof.defaultConstructionType === "string"
        ? [
            { key: true, value: roof.defaultConstructionType },
            { key: false, value: roof.defaultConstructionType },
          ]
        : undefined);

    return {
      ...raw,
      roof: {
        ...roof,
        defaultIsFlatRoof: roof.defaultIsFlatRoof ?? false,
        defaultConstructionTypeByIsFlatRoof,
      },
      topFloor: {
        ...topFloor,
        defaultHasAtticByIsFlatRoof:
          topFloor.defaultHasAtticByIsFlatRoof ?? [
            { key: true, value: false },
            { key: false, value: false },
          ],
        defaultIsAtticHeated: topFloor.defaultIsAtticHeated ?? false,
      },
    };
  },
};

const migrators: ConfigMigrator[] = [
  addRecommendedForSystems,
  addHeatingRenovationLabelTemplates,
  addRoofShapeDefaults,
];

/**
 * Thrown when a {@link ConfigMigrator} crashes while transforming a config.
 *
 * Carrying the failing migrator's `id` and the original error as `cause` makes
 * it possible to see *which* migration step blew up on malformed input, instead
 * of an opaque error surfacing from deep inside a migrator on the backend.
 */
export class ConfigMigrationError extends Error {
  /** `id` of the migrator that threw. */
  readonly migratorId: string;

  constructor(migratorId: string, options?: { cause?: unknown }) {
    const reason =
      options?.cause instanceof Error
        ? options.cause.message
        : options?.cause != null
          ? String(options.cause)
          : "unknown error";
    super(`Config migrator "${migratorId}" failed: ${reason}`, options);
    this.name = "ConfigMigrationError";
    this.migratorId = migratorId;
  }
}

/**
 * Runs each migrator in order, threading one migrator's output into the next.
 *
 * If a migrator throws, the error is wrapped in a {@link ConfigMigrationError}
 * that names the failing migrator and preserves the original error as `cause`,
 * so logs point straight at the culprit.
 */
export function applyMigrators(
  raw: unknown,
  migratorsToApply: ConfigMigrator[],
): unknown {
  let fixed = raw;
  for (const migrator of migratorsToApply) {
    try {
      fixed = migrator.migrate(fixed);
    } catch (cause) {
      throw new ConfigMigrationError(migrator.id, { cause });
    }
  }
  return fixed;
}

export function detectMigrations(
  _raw: unknown,
  issues: ValidationIssue[],
): ConfigMigrator[] {
  const applicable = new Set<ConfigMigrator>();
  for (const issue of issues) {
    const migrator = migrators.find((m) => m.canFix(issue));
    if (migrator == null) return [];
    applicable.add(migrator);
  }
  return Array.from(applicable);
}

export type ValidateAndMigrateResult =
  | { success: true; data: DETConfig; migrated: boolean }
  | { success: false; issues: ValidationIssue[]; migrated: boolean };

/**
 * Validates a config and, if it fails only with auto-fixable issues, applies
 * the matching migrators and re-validates.
 *
 * @throws {ConfigMigrationError} if a matched migrator crashes while
 * transforming the config — the error names the failing migrator and preserves
 * the original error as `cause`.
 */
export function validateAndMigrate(raw: unknown): ValidateAndMigrateResult {
  const result = validateConfig(raw);
  if (result.success) return { ...result, migrated: false };
  const applicable = detectMigrations(raw, result.issues);
  if (applicable.length === 0) return { ...result, migrated: false };
  const fixed = applyMigrators(raw, applicable);
  return { ...validateConfig(fixed), migrated: true };
}
