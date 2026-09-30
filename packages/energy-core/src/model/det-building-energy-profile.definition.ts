export type ModelValueType = "string" | "number" | "boolean";
export type NgsiLdAttributeType = "Property";

export type ModelAttributeDefinition = {
  valueType: ModelValueType;
  ngsiType: NgsiLdAttributeType;
  description?: string;
  unitCode?: string;
  example: string | number | boolean;
  required?: boolean;
  iri?: string;
};

export type ModelDefinition = {
  type: string;
  contextUrl: string;
  namespace: string;
  schemaId?: string;
  description?: string;
  attributes: Record<string, ModelAttributeDefinition>;
};

export type ModelAttributeSetDefinition = {
  type: string;
  attributes: Record<string, ModelAttributeDefinition>;
};

export const detBuildingEnergyProfileModel = {
  type: "DETBuildingEnergyProfile",
  attributes: {
    annualTotalEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Total annual energy demand of the building, including heating-related energy and electrical energy use.",
      unitCode: "KWH",
      example: 12000,
      required: false,
    },
    annualTotalCost: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Total annual energy cost of the building, including heating-related costs and electricity costs.",
      example: 2500,
      required: false,
    },
    annualHeatingEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual energy demand associated with building heating and domestic hot water.",
      unitCode: "KWH",
      example: 9000,
      required: false,
    },
    annualTotalHeatingCost: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual cost associated with heating, including thermal energy carrier costs and electricity used for heating where applicable.",
      example: 1800,
      required: false,
    },
    annualPrimaryEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Total annual primary energy demand associated with the building energy profile.",
      unitCode: "KWH",
      example: 14000,
      required: false,
    },
    annualElectricalPrimaryEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual primary energy demand associated with the building's electricity use.",
      unitCode: "KWH",
      example: 5400,
      required: false,
    },
    annualEnergyCarrierPrimaryDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual primary energy demand associated with the selected heating energy carrier.",
      unitCode: "KWH",
      example: 9900,
      required: false,
    },
    annualCo2EmissionsTonnes: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Total annual CO2 emissions in tonnes associated with the building energy profile.",
      example: 3.2,
      required: false,
    },
    annualTotalElectricalEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Total annual electrical energy demand, including household electricity and electricity used for heating where applicable.",
      unitCode: "KWH",
      example: 3000,
      required: false,
    },
    annualHouseholdElectricalEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual household electrical energy demand excluding electricity used for heating.",
      unitCode: "KWH",
      example: 3000,
      required: false,
    },
    annualElectricalHeatingEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual electrical energy demand used for heating.",
      unitCode: "KWH",
      example: 0,
      required: false,
    },
    annualHouseholdElectricalEnergyCost: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual cost associated with household electrical energy demand excluding electricity used for heating.",
      example: 576,
      required: false,
    },
    electricityBaseRate: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual fixed electricity base rate used for the building energy cost profile.",
      example: 50,
      required: false,
    },
    electricityUnitRate: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Electricity unit rate used for the building energy cost profile.",
      example: 0.192,
      required: false,
    },
    annualCarrierHeatingEnergyDemand: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual heating energy demand covered by the selected non-electrical or thermal energy carrier.",
      unitCode: "KWH",
      example: 9000,
      required: false,
    },
    annualEnergyCarrierHeatingCost: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Annual cost associated with the selected heating energy carrier.",
      example: 533.04,
      required: false,
    },
    heatingSystemType: {
      valueType: "string",
      ngsiType: "Property",
      description:
        "Heating system type used for the building energy profile.",
      example: "standard_boiler_70_55",
      required: false,
    },
    energyCarrierType: {
      valueType: "string",
      ngsiType: "Property",
      description:
        "Primary energy carrier used by the heating system.",
      example: "heating_oil",
      required: false,
    },
    energyCarrierUnit: {
      valueType: "string",
      ngsiType: "Property",
      description: "Unit used for the selected heating energy carrier.",
      example: "L",
      required: false,
    },
    energyCarrierUnitRate: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Unit rate used for the selected heating energy carrier.",
      example: 0.597,
      required: false,
    },
    energyCarrierBaseRate: {
      valueType: "number",
      ngsiType: "Property",
      description:
        "Fixed base rate used for the selected heating energy carrier.",
      example: 0,
      required: false,
    },
    currency: {
      valueType: "string",
      ngsiType: "Property",
      description:
        "Currency code used for cost and rate attributes.",
      example: "EUR",
      required: false,
    },
  },
} as const satisfies ModelAttributeSetDefinition;
