type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type NgsiLdProperty<T extends JsonValue = JsonValue> = {
  type: "Property";
  value: T;
  unitCode?: string;
  observedAt?: string;
};

export type DETBuildingEnergyProfileEntity = {
  id: string;
  type: "DETBuildingEnergyProfile";
  "@context": string | string[];

  annualTotalEnergyDemand: NgsiLdProperty<number>;
  annualTotalCost: NgsiLdProperty<number>;
  annualHeatingEnergyDemand: NgsiLdProperty<number>;
  annualTotalHeatingCost: NgsiLdProperty<number>;
  annualPrimaryEnergyDemand: NgsiLdProperty<number>;
  annualElectricalPrimaryEnergyDemand: NgsiLdProperty<number>;
  annualEnergyCarrierPrimaryDemand: NgsiLdProperty<number>;
  annualCo2EmissionsTonnes: NgsiLdProperty<number>;
  annualTotalElectricalEnergyDemand: NgsiLdProperty<number>;
  annualHouseholdElectricalEnergyDemand: NgsiLdProperty<number>;
  annualElectricalHeatingEnergyDemand: NgsiLdProperty<number>;
  annualHouseholdElectricalEnergyCost: NgsiLdProperty<number>;
  electricityBaseRate: NgsiLdProperty<number>;
  electricityUnitRate: NgsiLdProperty<number>;
  annualCarrierHeatingEnergyDemand: NgsiLdProperty<number>;
  annualEnergyCarrierHeatingCost: NgsiLdProperty<number>;
  heatingSystemType: NgsiLdProperty<string>;
  energyCarrierType: NgsiLdProperty<string>;
  energyCarrierUnit: NgsiLdProperty<string>;
  energyCarrierUnitRate: NgsiLdProperty<number>;
  energyCarrierBaseRate: NgsiLdProperty<number>;
  currency: NgsiLdProperty<string>;
};
