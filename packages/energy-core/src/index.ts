export type { KeyedValues } from "./types/keyed-values.js";
export type {
  InterpolatedNumber,
  InterpolationPoint,
  LinearInterpolation,
} from "./types/interpolated-number.js";
export type {
  RangeBands,
  RangeFirst,
  RangeMiddle,
  RangeLast,
  Ranges,
  RangeKey,
  YearBands,
} from "./types/range-bands.js";
export { BuildingType } from "./types/building-type.js";
export type { EnergyEfficiencyClass } from "./types/energy-efficiency-class.js";
export type { DETInput } from "./types/input/index.js";
export type { PreRenovationValues } from "./types/input/preRenovation.js";
export type { DETGeneralInput } from "./types/input/general.js";
export type { DETHeatInput } from "./types/input/heat.js";
export type { DETElectricityInput } from "./types/input/electricity.js";
export type { DETConfig } from "./types/config/index.js";
export type { DETGeneralConfig } from "./types/config/general.js";
export type {
  DETHeatConfig,
  PrimaryEnergyCarrierData,
  ElectricityTypeData,
  CarrierSelection,
  CarrierRequirements,
  HeatingSystemSelection,
  HeatingSystemRequirements,
} from "./types/config/heat.js";
export {
  isCarrierCompatible,
  isHeatingSystemCompatible,
} from "./types/config/heat.js";
export type { DETRoofConfig } from "./types/config/roof.js";
export type { DETTopFloorConfig } from "./types/config/topFloor.js";
export type {
  DETOuterWallConfig,
  OuterWallConstructionType,
} from "./types/config/outerWall.js";
export type { DETBottomFloorConfig } from "./types/config/bottomFloor.js";
export type { DETWindowsConfig } from "./types/config/windows.js";
export type { DETRenovationConfig } from "./types/config/renovation.js";
export type { DETRoofInput } from "./types/input/roof.js";
export type { DETRoofWindowsInput } from "./types/input/roofWindows.js";
export type { DETExteriorWallWindowsInput } from "./types/input/exteriorWallWindows.js";
export type { DETTopFloorInput } from "./types/input/topFloor.js";
export type { DETOuterWallInput } from "./types/input/outerWall.js";
export type { DETBottomFloorInput } from "./types/input/bottomFloor.js";
export { HeatFlowDirection } from "./types/heat-flow-direction.js";
export { RoofInsulationType } from "./types/roof-insulation-type.js";
export type { Selection, SelectionFilter } from "./types/selection.js";
export { DEFAULT_CONFIG } from "./types/config/default-config.js";
export type { Subsidy, SubsidyBenefit } from "./types/subsidies/subsidies.js";

export { resolveKeyedValue } from "./types/keyed-values.js";
export { resolveInterpolatedNumber } from "./types/interpolated-number.js";
export { resolveRangeBand, resolveYearBand } from "./types/range-bands.js";

export { calculate } from "./calculate.js";
export type { CalculationResult, CalculateOptions, ResolvedDETInput } from "./calculate.js";

export { makeNgsiLdEntity } from "./ngsi-ld.js";
export type { NgsiLdProperty, DETBuildingEnergyProfileEntity } from "./types/ngsi-ld.js";
export { detBuildingEnergyProfileModel } from "./model/det-building-energy-profile.definition.js";
export type {
  ModelAttributeSetDefinition,
  ModelAttributeDefinition,
  ModelDefinition,
  ModelValueType,
  NgsiLdAttributeType,
} from "./model/det-building-energy-profile.definition.js";
export { validateConfig, validateInput, detectMigrations, validateAndMigrate, applyMigrators, ConfigMigrationError } from "./validators/index.js";
export type { ValidationResult, ValidationIssue, ConfigMigrator, ValidateAndMigrateResult } from "./validators/index.js";
export { DETConfigSchema } from "./types/config/index.js";
export { DETInputSchema } from "./types/input/index.js";

export type {
  InputPatch,
  Renovation,
  HeatingRenovationConfig,
  HeatingRenovationLabelTemplates,
  HeatingSurfaceRenovationConfig,
  InsulationRenovationKeys,
  InsulationRenovationConfig,
  InsulationRenovationConfigs,
} from "./types/renovation/renovation.js";
export { insulationKeys } from "./types/renovation/renovation.js";
export { applyRenovation } from "./types/renovation/applyRenovation.js";
export {
  generateHeatingRenovations,
  generateInsulationRenovations,
  generateHeatingSurfaceRenovations,
} from "./types/renovation/generate.js";
