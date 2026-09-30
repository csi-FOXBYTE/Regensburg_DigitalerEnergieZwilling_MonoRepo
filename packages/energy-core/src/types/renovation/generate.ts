import type { DETConfig } from "../config";
import type { DETInput } from "../input";
import type { RangeKey, RangeLast } from "../range-bands";
import { insulationKeys } from "./renovation";
import type {
  InputPatch,
  InsulationRenovationKeys,
  Renovation,
} from "./renovation";
import { DETEnergyCaluclator } from "../../calculators/energy/index.js";

function localizedValue(
  localization: Record<string, string>,
  locale: string,
  description: string,
): string {
  const value = localization[locale];
  if (value == null) {
    throw new Error(`Translation for ${description} did not exist for locale ${locale}`);
  }
  return value;
}

function generateHeatingRenovationLabel(
  config: DETConfig,
  locale: string,
  currentCarrier: string,
  currentSystem: string,
  targetCarrier: string,
  targetSystem: string,
): string {
  const templates = config.renovation.heatingRenovationLabelTemplates;
  const carrierChanged = targetCarrier !== currentCarrier;
  const systemChanged = targetSystem !== currentSystem;
  const templateLocalization = carrierChanged && systemChanged
    ? templates.carrierAndSystem
    : carrierChanged
      ? templates.carrierOnly
      : templates.systemOnly;
  const template = localizedValue(templateLocalization, locale, "heating renovation label template");
  const carrier = config.heat.primaryEnergyCarriers.find((entry) => entry.value === targetCarrier);
  const system = config.heat.heatingSystemTypes.find((entry) => entry.value === targetSystem);
  if (carrier == null || system == null) {
    throw new Error("Heating renovation references an unknown carrier or system");
  }
  const carrierLabel = localizedValue(carrier.localization, locale, `primary energy carrier ${targetCarrier}`);
  const systemLabel = localizedValue(system.localization, locale, `heating system ${targetSystem}`);
  return template.replaceAll("{{carrier}}", carrierLabel).replaceAll("{{system}}", systemLabel);
}

function isYearInRange(
  year: number | RangeKey | null | undefined,
  range: RangeKey,
): boolean {
  if (year == null) return false;
  const rangeFrom = range.from ?? -Infinity;
  const rangeTo = range.to ?? Infinity;
  if (typeof year === "number") {
    return year >= rangeFrom && year <= rangeTo;
  }
  const yearFrom = year.from ?? -Infinity;
  const yearTo = year.to ?? Infinity;
  return yearFrom <= rangeTo && yearTo >= rangeFrom;
}

function isInsulationRecommended(
  key: InsulationRenovationKeys,
  config: DETConfig,
  ctx: ReturnType<typeof DETEnergyCaluclator>,
): boolean {
  const { recommendYearRange } = config.renovation.insulationRenovations[key];
  switch (key) {
    case "roof":
      if (ctx.get("roofHasInsulation")) return false;
      return isYearInRange(ctx.get("roofYear"), recommendYearRange);
    case "topFloor":
      if (ctx.get("topFloorHasInsulation")) return false;
      return isYearInRange(ctx.get("topFloorYear"), recommendYearRange);
    case "bottomFloor":
      if (ctx.get("bottomFloorHasInsulation")) return false;
      return isYearInRange(ctx.get("bottomFloorYear"), recommendYearRange);
    case "outerWalls":
      if (ctx.get("outerWallHasInsulation")) return false;
      return isYearInRange(ctx.get("outerWallYear"), recommendYearRange);
    case "outerWindows":
      return isYearInRange(ctx.get("exteriorWallWindowsYear"), recommendYearRange);
    case "roofWindows":
      return isYearInRange(ctx.get("roofWindowsYear"), recommendYearRange);
  }
}

export function generateHeatingRenovations(
  config: DETConfig,
  input: DETInput,
  locale: string,
  systemRenewalLabel?: string,
): Renovation[] {
  const renovations: Renovation[] = [];
  const lastYearBand = config.general.generalYearBands[
    config.general.generalYearBands.length - 1
  ] as RangeLast;
  const ctx = DETEnergyCaluclator({ config, input });
  const currentCarrierValue = ctx.get("primaryEnergyCarrier");
  const currentSystemValue = ctx.get("heatingSystemType");
  if (systemRenewalLabel != null) {
    const currentCarrier = config.heat.primaryEnergyCarriers.find(
      (carrier) => carrier.value === currentCarrierValue,
    );
    const currentSystem = config.heat.heatingSystemTypes.find(
      (system) => system.value === currentSystemValue,
    );
    const excludeFromSystemRenewal =
      currentCarrier?.excludeFromSystemRenewal === true ||
      currentSystem?.excludeFromSystemRenewal === true;

    if (!excludeFromSystemRenewal) {
      renovations.push({
        id: "heat_renew",
        label: systemRenewalLabel,
        patch: { heat: { heatingSystemConstructionYear: lastYearBand } },
        recommended: false,
      });
    }
  }

  const currentCarrierIsTarget = config.renovation.primaryEnergyCarrierTargets.includes(
    currentCarrierValue,
  );

  const compatible = config.renovation.heatingRenovations.filter((hRenConf) => {
    if (hRenConf.targetCarrier === currentCarrierValue && hRenConf.targetSystem === currentSystemValue) return false;
    const carrier = config.heat.primaryEnergyCarriers.find(
      (c) => c.value === hRenConf.targetCarrier,
    );
    const system = config.heat.heatingSystemTypes.find(
      (s) => s.value === hRenConf.targetSystem,
    );
    const carrierRequirementsSatisfied = carrier != null &&
      (carrier.requirements?.storage === undefined ||
        carrier.requirements.storage === ctx.get("hasStorage")) &&
      (carrier.requirements?.gas === undefined ||
        carrier.requirements.gas === ctx.get("hasGasSupply"));
    const systemRequirementsSatisfied = system != null &&
      (system.requirements?.geothermal !== true ||
        ctx.get("hasGeothermalAvailability"));
    return (
      carrierRequirementsSatisfied &&
      systemRequirementsSatisfied
    );
  });

  const highestPriority = currentCarrierIsTarget
    ? Math.min(...compatible.map((r) => r.priority))
    : Infinity;

  for (const hRenConf of compatible) {
    const label = generateHeatingRenovationLabel(
      config,
      locale,
      currentCarrierValue,
      currentSystemValue,
      hRenConf.targetCarrier,
      hRenConf.targetSystem,
    );
    renovations.push({
      id: `heat_${hRenConf.targetCarrier}_${hRenConf.targetSystem}`,
      label,
      patch: {
        heat: {
          primaryEnergyCarrier: hRenConf.targetCarrier,
          heatingSystemType: hRenConf.targetSystem,
          heatingSystemConstructionYear: lastYearBand,
        },
      },
      recommended: hRenConf.priority === highestPriority,
    });
  }
  return renovations;
}

function makeInsulationRenovation(
  key: InsulationRenovationKeys,
  config: DETConfig,
  ctx: ReturnType<typeof DETEnergyCaluclator>,
  lastYearBand: RangeLast,
): { patch: InputPatch; recommended: boolean } {
  const targetUValue = config.renovation.insulationRenovations[key].uValue;
  switch (key) {
    case "roof":
      if (ctx.get("roofUValue") <= targetUValue) return { patch: {}, recommended: false };
      return { patch: { roof: { uValue: targetUValue, year: lastYearBand } }, recommended: isInsulationRecommended(key, config, ctx) };
    case "topFloor":
      if (ctx.get("topFloorUValue") <= targetUValue) return { patch: {}, recommended: false };
      return { patch: { topFloor: { uValue: targetUValue, year: lastYearBand } }, recommended: isInsulationRecommended(key, config, ctx) };
    case "bottomFloor":
      if (ctx.get("bottomFloorUValue") <= targetUValue) return { patch: {}, recommended: false };
      return { patch: { bottomFloor: { uValue: targetUValue, year: lastYearBand } }, recommended: isInsulationRecommended(key, config, ctx) };
    case "outerWalls":
      if (ctx.get("outerWallUValue") <= targetUValue) return { patch: {}, recommended: false };
      return { patch: { outerWall: { uValue: targetUValue, year: lastYearBand } }, recommended: isInsulationRecommended(key, config, ctx) };
    case "outerWindows":
      if (ctx.get("exteriorWallWindowsUValue") <= targetUValue) return { patch: {}, recommended: false };
      return { patch: { exteriorWallWindows: { uValue: targetUValue, year: lastYearBand } }, recommended: isInsulationRecommended(key, config, ctx) };
    case "roofWindows":
      if (ctx.get("roofWindowsUValue") <= targetUValue) return { patch: {}, recommended: false };
      return { patch: { roofWindows: { uValue: targetUValue, year: lastYearBand } }, recommended: isInsulationRecommended(key, config, ctx) };
  }
}

export function generateInsulationRenovations(
  config: DETConfig,
  input: DETInput,
  translate: (key: InsulationRenovationKeys) => string,
): Renovation[] {
  const renovations: Renovation[] = [];
  const lastYearBand = config.general.generalYearBands[
    config.general.generalYearBands.length - 1
  ] as RangeLast;
  const ctx = DETEnergyCaluclator({ config, input });
  const isSpaceBelowRoofHeated = ctx.get("isSpaceBelowRoofHeated");
  for (const key of insulationKeys) {
    if (key === "roof" && !isSpaceBelowRoofHeated) continue;
    if (key === "roofWindows" && !isSpaceBelowRoofHeated) continue;
    if (key === "topFloor" && isSpaceBelowRoofHeated) continue;
    const { patch, recommended } = makeInsulationRenovation(key, config, ctx, lastYearBand);
    const label = translate(key);
    renovations.push({ id: `envelope_${key}`, patch, label, recommended });
  }
  return renovations;
}

export function generateHeatingSurfaceRenovations(
  config: DETConfig,
  input: DETInput,
  locale: string,
): Renovation[] {
  const ctx = DETEnergyCaluclator({ config, input });
  const currentSystem = ctx.get("heatingSystemType");
  const currentSurface = ctx.get("heatingSurfaceType");
  const currentSurfaceIsRecommended = config.renovation.heatingSurfaceRenovations.some(
    (r) => r.targetSurfaceType === currentSurface && r.recommendedForSystems.includes(currentSystem),
  );
  const renovations: Renovation[] = [];
  for (const hRenConf of config.renovation.heatingSurfaceRenovations) {
    if (hRenConf.targetSurfaceType === currentSurface) continue;
    const label = hRenConf.localization[locale];
    if (label == null) {
      throw new Error(
        "Translation for heat renovation did not exist for locale " + locale,
      );
    }
    renovations.push({
      id: `surface_${hRenConf.targetSurfaceType}`,
      label,
      patch: { heat: { heatingSurfaceType: hRenConf.targetSurfaceType } },
      recommended: !currentSurfaceIsRecommended && hRenConf.recommendedForSystems.includes(currentSystem),
    });
  }
  return renovations;
}
