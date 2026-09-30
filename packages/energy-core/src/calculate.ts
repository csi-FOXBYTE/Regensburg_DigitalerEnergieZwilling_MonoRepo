import type { DETConfig } from "./types/config/index.js";
import type { DETInput } from "./types/input/index.js";
import type { PreRenovationValues } from "./types/input/preRenovation.js";
import type { EnergyEfficiencyClass } from "./types/energy-efficiency-class.js";
import { DETEnergyCaluclator } from "./calculators/energy/index.js";

export type ResolvedDETInput = Omit<DETInput, "general" | "outerWall"> & {
  general: DETInput["general"] & {
    numberOfApartments: number;
    numberOfPeople: number;
    averagePeoplePerApartment: number;
  };
  outerWall: Omit<DETInput["outerWall"], "area"> & {
    area: number;
    allowsAdditionalInsulation: boolean;
  };
};

export type CalculationResult = {
  energyConsumptionPerSquareMeter: number;
  energyEfficiencyClass: EnergyEfficiencyClass;
  /** @deprecated use annualTotalCost */
  yearlyCost: number;
  /** @deprecated use annualCo2EmissionsTonnes */
  co2Emissions: number;
  hadInternalGains: boolean;

  annualTotalEnergyDemand: number;
  annualTotalCost: number;
  annualHeatingEnergyDemand: number;
  annualTotalHeatingCost: number;
  annualPrimaryEnergyDemand: number;
  annualElectricalPrimaryEnergyDemand: number;
  annualEnergyCarrierPrimaryDemand: number;
  annualCo2EmissionsTonnes: number;
  annualTotalElectricalEnergyDemand: number;
  annualHouseholdElectricalEnergyDemand: number;
  annualElectricalHeatingEnergyDemand: number;
  annualHouseholdElectricalEnergyCost: number;
  electricityBaseRate: number;
  electricityUnitRate: number;
  annualCarrierHeatingEnergyDemand: number;
  annualEnergyCarrierHeatingCost: number;
  heatingSystemType: string;
  energyCarrierType: string;
  energyCarrierUnit: string;
  energyCarrierUnitRate: number;
  energyCarrierBaseRate: number;

  preRenovationValues: PreRenovationValues;
  resolvedInput: ResolvedDETInput;
};

export type CalculateOptions = {
  debug?: boolean;
};

export function calculate(
  config: DETConfig,
  input: DETInput,
  options?: CalculateOptions,
): CalculationResult {
  const ctx = DETEnergyCaluclator({ config, input });

  const totalCost = ctx.get("totalCost");
  const totalCo2Emissions = ctx.get("totalCo2Emissions");

  const result: CalculationResult = {
    energyConsumptionPerSquareMeter: ctx.get("totalEnergyDemandPerSquareMeter"),
    energyEfficiencyClass: ctx.get("energyEfficiencyClass"),
    yearlyCost: totalCost,
    co2Emissions: totalCo2Emissions,
    hadInternalGains: ctx.get("hasInternalGains"),

    annualTotalEnergyDemand: ctx.get("totalEnergyDemand"),
    annualTotalCost: totalCost,
    annualHeatingEnergyDemand: ctx.get("netThermalDemand"),
    annualTotalHeatingCost: ctx.get("totalHeatingCost"),
    annualPrimaryEnergyDemand: ctx.get("primaryEnergyDemand"),
    annualElectricalPrimaryEnergyDemand: ctx.get("electricalPrimaryEnergyDemand"),
    annualEnergyCarrierPrimaryDemand: ctx.get("thermalPrimaryEnergyDemand"),
    annualCo2EmissionsTonnes: totalCo2Emissions,
    annualTotalElectricalEnergyDemand: ctx.get("electricalEnergyDemand"),
    annualHouseholdElectricalEnergyDemand: ctx.get("baseElectricalLoad"),
    annualElectricalHeatingEnergyDemand: ctx.get("electricalHeatingEnergyDemand"),
    annualHouseholdElectricalEnergyCost: ctx.get("baseElectricalLoadCost"),
    electricityBaseRate: ctx.get("electricityBaseRate"),
    electricityUnitRate: ctx.get("electricityUnitRate"),
    annualCarrierHeatingEnergyDemand: ctx.get("thermalEnergyDemand"),
    annualEnergyCarrierHeatingCost: ctx.get("thermalCarrierCost"),
    heatingSystemType: ctx.get("heatingSystemType"),
    energyCarrierType: ctx.get("primaryEnergyCarrier"),
    energyCarrierUnit: ctx.get("primaryEnergyCarrierData").unit,
    energyCarrierUnitRate: ctx.get("thermalUnitRate"),
    energyCarrierBaseRate: ctx.get("thermalBaseRate"),

    preRenovationValues: input.preRenovationValues ?? {
      totalEnergyDemand: ctx.get("calculatedThermalBaseline"),
      primaryEnergyCarrier: ctx.get("primaryEnergyCarrier"),
      heatingSystemType: ctx.get("heatingSystemType"),
      electricityOffset: ctx.get("baseElectricalLoad"),
      hadInternalGains: ctx.get("hasInternalGains"),
    },
    resolvedInput: {
      general: {
        buildingYear: ctx.get("buildingYear"),
        numberOfStories: ctx.get("numberOfStories"),
        buildingHeight: ctx.get("buildingHeight"),
        lowestEaveHeight: ctx.get("lowestEaveHeight"),
        buildingBaseArea: ctx.get("buildingBaseArea"),
        livingArea: ctx.get("livingArea") ?? ctx.get("netFloorArea") / ctx.get("netFloorAreaFromLivingAreaFactor"),
        numberOfApartments: ctx.get("numberOfApartments"),
        numberOfPeople: ctx.get("numberOfPeople"),
        averagePeoplePerApartment: ctx.get("averagePeoplePerApartment"),
        type: ctx.get("buildingType"),
      },
      heat: {
        heatingSystemConstructionYear: ctx.get("heatingSystemConstructionYear"),
        primaryEnergyCarrier: ctx.get("primaryEnergyCarrier"),
        heatingSystemType: ctx.get("heatingSystemType"),
        heatingSurfaceType: ctx.get("heatingSurfaceType"),
        hasGasSupply: ctx.get("hasGasSupply"),
        hasStorage: ctx.get("hasStorage"),
        hasGeothermalAvailability: ctx.get("hasGeothermalAvailability"),
        userThermalUnitRate: ctx.get("thermalUnitRate"),
        userThermalBaseRate: ctx.get("thermalBaseRate"),
        userThermalTotalCost: ctx.get("thermalCarrierCost"),
      },
      electricity: {
        electricityType: ctx.get("electricityType"),
        electricityUnitRate: ctx.get("electricityUnitRate"),
        userElectricityBaseRate: ctx.get("electricityBaseRate"),
        userElectricityConsumption: ctx.get("electricalEnergyDemand"),
      },
      roof: {
        area: ctx.get("roofArea"),
        isFlatRoof: ctx.get("isFlatRoof"),
        year: ctx.get("roofYear"),
        hasInsulation: ctx.get("roofHasInsulation"),
        insulationType: ctx.get("roofInsulationType"),
        constructionType: ctx.get("roofConstructionType"),
        insulationThickness: ctx.get("roofInsulationThickness"),
      },
      roofWindows: {
        area: ctx.get("roofWindowsArea"),
        year: ctx.get("roofWindowsYear"),
        windowType: ctx.get("roofWindowsType"),
        uValue: ctx.get("roofWindowsUValue"),
      },
      exteriorWallWindows: {
        area: ctx.get("exteriorWallWindowsArea"),
        year: ctx.get("exteriorWallWindowsYear"),
        windowType: ctx.get("exteriorWallWindowsType"),
        uValue: ctx.get("exteriorWallWindowsUValue"),
      },
      topFloor: {
        area: ctx.get("topFloorArea"),
        year: ctx.get("topFloorYear"),
        isAtticHeated: ctx.get("isAtticHeated"),
        topFloorType: ctx.get("topFloorType"),
        hasInsulation: ctx.get("topFloorHasInsulation"),
        insulationThickness: ctx.get("topFloorInsulationThickness"),
        hasAttic: ctx.get("hasAttic"),
      },
      outerWall: {
        area: ctx.get("outerWallArea"),
        areaWithoutAttic: ctx.get("outerWallAreaWithoutAttic"),
        atticArea: ctx.get("outerWallAtticArea"),
        adjacentWallArea: ctx.get("adjacentWallArea"),
        year: ctx.get("outerWallYear"),
        hasInsulation: ctx.get("outerWallHasInsulation"),
        constructionType: ctx.get("outerWallConstructionType"),
        insulationThickness: ctx.get("outerWallInsulationThickness"),
        allowsAdditionalInsulation: ctx.get("outerWallAllowsAdditionalInsulation"),
      },
      bottomFloor: {
        area: ctx.get("bottomFloorArea"),
        year: ctx.get("bottomFloorYear"),
        isHeated: ctx.get("bottomFloorIsHeated"),
        hasInsulation: ctx.get("bottomFloorHasInsulation"),
        constructionType: ctx.get("bottomFloorConstructionType"),
        insulationThickness: ctx.get("bottomFloorInsulationThickness"),
        hasBasement: ctx.get("hasBasement"),
        isBasementHeated: ctx.get("isBasementHeated"),
      },
    },
  };

  if (options?.debug) {
    console.log("[DET] Resolved values:", ctx.getAll());
  }

  return result;
}
