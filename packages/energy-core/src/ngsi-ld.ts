import type { CalculationResult } from "./calculate.js";
import type { NgsiLdProperty, DETBuildingEnergyProfileEntity } from "./types/ngsi-ld.js";

function prop<T extends string | number | boolean | null>(value: T): NgsiLdProperty<T> {
  return { type: "Property", value };
}

function kwh(value: number): NgsiLdProperty<number> {
  return { type: "Property", value, unitCode: "KWH" };
}

export function makeNgsiLdEntity(
  result: CalculationResult,
  currency: string,
  buildingId: string,
  context: string | string[],
): DETBuildingEnergyProfileEntity {
  return {
    id: buildingId,
    type: "DETBuildingEnergyProfile",
    "@context": context,

    annualTotalEnergyDemand: kwh(result.annualTotalEnergyDemand),
    annualTotalCost: prop(result.annualTotalCost),
    annualHeatingEnergyDemand: kwh(result.annualHeatingEnergyDemand),
    annualTotalHeatingCost: prop(result.annualTotalHeatingCost),
    annualPrimaryEnergyDemand: kwh(result.annualPrimaryEnergyDemand),
    annualElectricalPrimaryEnergyDemand: kwh(result.annualElectricalPrimaryEnergyDemand),
    annualEnergyCarrierPrimaryDemand: kwh(result.annualEnergyCarrierPrimaryDemand),
    annualCo2EmissionsTonnes: prop(result.annualCo2EmissionsTonnes),
    annualTotalElectricalEnergyDemand: kwh(result.annualTotalElectricalEnergyDemand),
    annualHouseholdElectricalEnergyDemand: kwh(result.annualHouseholdElectricalEnergyDemand),
    annualElectricalHeatingEnergyDemand: kwh(result.annualElectricalHeatingEnergyDemand),
    annualHouseholdElectricalEnergyCost: prop(result.annualHouseholdElectricalEnergyCost),
    electricityBaseRate: prop(result.electricityBaseRate),
    electricityUnitRate: prop(result.electricityUnitRate),
    annualCarrierHeatingEnergyDemand: kwh(result.annualCarrierHeatingEnergyDemand),
    annualEnergyCarrierHeatingCost: prop(result.annualEnergyCarrierHeatingCost),
    heatingSystemType: prop(result.heatingSystemType),
    energyCarrierType: prop(result.energyCarrierType),
    energyCarrierUnit: prop(result.energyCarrierUnit),
    energyCarrierUnitRate: prop(result.energyCarrierUnitRate),
    energyCarrierBaseRate: prop(result.energyCarrierBaseRate),
    currency: prop(currency),
  };
}
