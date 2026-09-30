import { HeatFlowDirection } from "../heat-flow-direction";
import { RoofInsulationType } from "../roof-insulation-type";
import { BuildingType } from "../building-type";
import type { DETConfig } from ".";

export const DEFAULT_CONFIG: DETConfig = {
  general: {
    supportedLocales: ["de", "en"],
    // generalYearBands: [
    //   { to: 1918 },
    //   { from: 1919, to: 1948 },
    //   { from: 1949, to: 1957 },
    //   { from: 1958, to: 1968 },
    //   { from: 1969, to: 1978 },
    //   { from: 1979, to: 1983 },
    //   { from: 1984, to: 1994 },
    //   { from: 1995, to: 2001 },
    //   { from: 2002, to: 2006 },
    //   { from: 2007 },
    // ], ORIGINAL FROM MOCKUPS
    generalYearBands: [
      { to: 1918 },
      { from: 1919, to: 1948 },
      { from: 1949, to: 1957 },
      { from: 1958, to: 1968 },
      { from: 1969, to: 1978 },
      { from: 1979, to: 1983 },
      { from: 1984, to: 1986 },
      { from: 1987, to: 1994 },
      { from: 1995, to: 2001 },
      { from: 2002, to: 2006 },
      { from: 2007 },
    ],
    energyEfficiencyClasses: [
      { to: 30, value: "A+" },
      { from: 30, to: 50, value: "A" },
      { from: 50, to: 75, value: "B" },
      { from: 75, to: 100, value: "C" },
      { from: 100, to: 130, value: "D" },
      { from: 130, to: 160, value: "E" },
      { from: 160, to: 200, value: "F" },
      { from: 200, to: 250, value: "G" },
      { from: 250, value: "H" },
    ],
    energyEfficiencyClassColors: [
      { key: "A+", value: "#1B9E3E" },
      { key: "A", value: "#4CAF50" },
      { key: "B", value: "#6CB432" },
      { key: "C", value: "#B3CC2A" },
      { key: "D", value: "#ECDB23" },
      { key: "E", value: "#E8A824" },
      { key: "F", value: "#E67322" },
      { key: "G", value: "#D9381E" },
      { key: "H", value: "#A11A1A" },
    ],
    assumedFloorSlabThickness: 0.2,
    assumedInteriorStoryHeight: 2.75,
    defaultNumberOfApartments: [
      { key: BuildingType.SINGLE_FAMILY, value: 1 },
      { key: BuildingType.MULTI_FAMILY, value: 2 },
    ],
    defaultPeoplePerApartment: 3,
    heatedAirVolumeCorrectionFactor: [
      { to: 3, value: 0.76 },
      { from: 3, value: 0.8 },
    ],
    usableFloorAreaFactor: 0.32,
    netFloorAreaFromUsableFloorAreaFactor: [
      {
        key: BuildingType.SINGLE_FAMILY,
        value: [
          { key: false, value: 0.917 },
          { key: true, value: 0.815 },
        ],
      },
      {
        key: BuildingType.MULTI_FAMILY,
        value: [
          { key: false, value: 0.917 },
          { key: true, value: 0.917 },
        ],
      },
    ],
    netFloorAreaFromLivingAreaFactor: 1.1,
  },
  heat: {
    primaryEnergyCarriers: [
      {
        value: "heating_oil",
        localization: {
          de: "Heizöl",
          en: "Heating oil",
        },
        requirements: { storage: true },
        excludeFromSystemRenewal: true,
      },
      {
        value: "none",
        localization: {
          de: "Strom",
          en: "Electricity",
        },
      },
      {
        value: "natural_gas",
        localization: {
          de: "Erdgas",
          en: "Natural gas",
        },
        requirements: { gas: true },
      },
      {
        value: "bio_gas",
        localization: {
          de: "Biogas",
          en: "Biogas",
        },
        requirements: { gas: true },
      },
      {
        value: "wood_biomass",
        localization: {
          de: "Holzscheite",
          en: "Wood logs",
        },
        requirements: { storage: true },
      },
      {
        value: "wood_pellets",
        localization: {
          de: "Holzpellets",
          en: "Wood pellets",
        },
        requirements: { storage: true },
      },
      {
        value: "district_heating",
        localization: {
          de: "Nah-/Fernwärme",
          en: "District heating",
        },
      },
    ],

    heatingSystemTypes: [
      {
        value: "standard_boiler_70_55",
        localization: {
          de: "Standardkessel (auch Holzkessel) 70/55°C",
          en: "Standard boiler (incl. wood boiler) 70/55°C",
        },
      },
      {
        value: "low_temperature_boiler_oil_gas_70_55",
        localization: {
          de: "Niedertemperaturkessel Öl/Gas 70/55°C",
          en: "Low-temperature boiler (oil/gas) 70/55°C",
        },
      },
      {
        value: "condensing_boiler_70_55",
        localization: {
          de: "Brennwertkessel 70/55°C",
          en: "Condensing boiler 70/55°C",
        },
      },
      {
        value: "improved_condensing_boiler_55_45",
        localization: {
          de: "Brennwertkessel (verbessert) 55/45°C",
          en: "Improved condensing boiler 55/45°C",
        },
      },
      {
        value: "district_heating_all_temperatures",
        localization: {
          de: "Fernwärme alle Temperaturen",
          en: "District heating all temperatures",
        },
      },
      {
        value: "air_source_heat_pump_55_45",
        localization: {
          de: "Elektrowärmepumpe Außenluft / Luft-Wasser 55/45°C",
          en: "Air-source heat pump 55/45°C",
        },
      },
      {
        value: "air_source_heat_pump_lt_40",
        localization: {
          de: "Elektrowärmepumpe Außenluft / Luft-Wasser <40°C",
          en: "Air-source heat pump <40°C",
        },
      },
      {
        value: "ground_source_heat_pump_55_45",
        localization: {
          de: "Elektrowärmepumpe Erdreich/Grundwasser / Sole-Wasser / Wasser-Wasser 55/45°C",
          en: "Ground-source heat pump 55/45°C",
        },
        requirements: { geothermal: true },
      },
      {
        value: "ground_source_heat_pump_lt_40",
        localization: {
          de: "Elektrowärmepumpe Erdreich/Grundwasser / Sole-Wasser / Wasser-Wasser <40°C",
          en: "Ground-source heat pump <40°C",
        },
        requirements: { geothermal: true },
      },
      {
        value: "oil_fired_single_stove",
        localization: {
          de: "Ölbefeuerte Einzelöfen",
          en: "Oil-fired single stove",
        },
      },
      {
        value: "gas_space_heater",
        localization: { de: "Gasraumheizer", en: "Gas space heater" },
      },
      {
        value: "electric_direct_heater",
        localization: {
          de: "Elektro-Direktheizgerät",
          en: "Electric direct heater",
        },
      },
      {
        value: "gas_heat_pump_hybrid",
        localization: {
          de: "Gas-Wärmepumpen-Hybridheizung",
          en: "Gas heat pump hybrid",
        },
      },
    ],
    heatingSurfaceTypes: [
      {
        value: "radiant_surface_heating",
        localization: { de: "Flächenheizung", en: "Radiant surface heating" },
      },
      {
        value: "free_heat_emitter",
        localization: {
          de: "Freie Heizflächen",
          en: "Free heat emitter surfaces",
        },
      },
    ],

    allowedHeatingSystemTypesByCarrier: [
      {
        key: "heating_oil",
        allowedValues: [
          "standard_boiler_70_55",
          "low_temperature_boiler_oil_gas_70_55",
          "condensing_boiler_70_55",
          "improved_condensing_boiler_55_45",
          "oil_fired_single_stove",
        ],
      },
      {
        key: "natural_gas",
        allowedValues: [
          "standard_boiler_70_55",
          "low_temperature_boiler_oil_gas_70_55",
          "condensing_boiler_70_55",
          "improved_condensing_boiler_55_45",
          "gas_space_heater",
          "gas_heat_pump_hybrid",
        ],
      },
      {
        key: "bio_gas",
        allowedValues: [
          "standard_boiler_70_55",
          "low_temperature_boiler_oil_gas_70_55",
          "condensing_boiler_70_55",
          "improved_condensing_boiler_55_45",
          "gas_space_heater",
          "gas_heat_pump_hybrid",
        ],
      },
      {
        key: "wood_biomass",
        allowedValues: ["standard_boiler_70_55"],
      },
      {
        key: "wood_pellets",
        allowedValues: ["standard_boiler_70_55"],
      },
      {
        key: "none",
        allowedValues: [
          "air_source_heat_pump_55_45",
          "air_source_heat_pump_lt_40",
          "ground_source_heat_pump_55_45",
          "ground_source_heat_pump_lt_40",
          "electric_direct_heater",
        ],
      },
      {
        key: "district_heating",
        allowedValues: ["district_heating_all_temperatures"],
      },
    ],

    defaultPrimaryEnergyCarrier: "natural_gas",
    defaultHeatingSystemType: [
      { key: "heating_oil", value: "standard_boiler_70_55" },
      { key: "natural_gas", value: "standard_boiler_70_55" },
      { key: "bio_gas", value: "standard_boiler_70_55" },
      { key: "wood_biomass", value: "standard_boiler_70_55" },
      { key: "wood_pellets", value: "standard_boiler_70_55" },
      { key: "none", value: "air_source_heat_pump_55_45" },
      { key: "district_heating", value: "district_heating_all_temperatures" },
    ],
    defaultHeatingSurfaceType: "free_heat_emitter",
    globalDefaultSource: "Quelle undefiniert",
    globalDefaultDate: new Date().toISOString(),

    // HDD
    heatingDegreeDays: 3626,
    // kHv
    ventilationHeatLossCorrectionFactor: 0.79,
    // kQwb
    hotWaterEnergyDemandFromAreaFactor: [
      { key: BuildingType.SINGLE_FAMILY, value: 11 },
      { key: BuildingType.MULTI_FAMILY, value: 15 },
    ],
    householdElectricityPerApartment: [
      {
        key: BuildingType.SINGLE_FAMILY,
        value: {
          points: [
            { at: 1, value: 1800 },
            { at: 2, value: 2700 },
            { at: 3, value: 3500 },
            { at: 4, value: 3800 },
            { at: 5, value: 4500 },
          ],
        },
      },
      {
        key: BuildingType.MULTI_FAMILY,
        value: {
          points: [
            { at: 1, value: 1200 },
            { at: 2, value: 1900 },
            { at: 3, value: 2400 },
            { at: 4, value: 2600 },
            { at: 5, value: 3100 },
          ],
        },
      },
    ],

    // bheiz, barb, bgrund, xco2, fp
    primaryEnergyCarrierData: [
      {
        key: "heating_oil",
        value: {
          energyPerUnit: 10.08,
          unit: "L",
          unitRate: 0.597,
          baseRate: 0,
          co2Factor: 288,
          primaryEnergyFactor: 1.1,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "none",
        value: {
          energyPerUnit: 1,
          unit: "kWh",
          unitRate: 0,
          baseRate: 0,
          co2Factor: 0,
          primaryEnergyFactor: 0,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "natural_gas",
        value: {
          energyPerUnit: 10.42,
          unit: "m³",
          unitRate: 0.652,
          baseRate: 181.83,
          co2Factor: 201,
          primaryEnergyFactor: 1.1,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "bio_gas",
        value: {
          energyPerUnit: 10.42,
          unit: "m³",
          unitRate: 0.652,
          baseRate: 181.83,
          co2Factor: 152,
          primaryEnergyFactor: 1.1,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "wood_biomass",
        value: {
          energyPerUnit: 1900,
          unit: "rm",
          unitRate: 57,
          baseRate: 0,
          co2Factor: 27,
          primaryEnergyFactor: 0.2,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "wood_pellets",
        value: {
          energyPerUnit: 4.9,
          unit: "kg",
          unitRate: 0.206,
          baseRate: 0,
          co2Factor: 36,
          primaryEnergyFactor: 0.2,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "district_heating",
        value: {
          energyPerUnit: 1,
          unit: "kWh",
          unitRate: 0.192,
          baseRate: 50,
          co2Factor: 280,
          primaryEnergyFactor: 1,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
    ],

    electricityTypes: [
      { value: "grid", localization: { de: "Mixstrom", en: "Grid" } },
      {
        value: "renewable",
        localization: { de: "Ökostrom", en: "Renewable" },
      },
    ],
    defaultElectricityType: "grid",
    electricityTypeData: [
      {
        key: "grid",
        value: {
          co2Factor: 366,
          unitRate: 0.192,
          baseRate: 50,
          primaryEnergyFactor: 1.8,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
      {
        key: "renewable",
        value: {
          co2Factor: 0,
          unitRate: 0.192,
          baseRate: 50,
          primaryEnergyFactor: 0,
          source: "Quelle undefiniert",
          date: new Date().toISOString(),
        },
      },
    ],
    electricalRatio: [
      { key: "standard_boiler_70_55", value: 0 },
      { key: "low_temperature_boiler_oil_gas_70_55", value: 0 },
      { key: "condensing_boiler_70_55", value: 0 },
      { key: "improved_condensing_boiler_55_45", value: 0 },
      { key: "district_heating_all_temperatures", value: 0 },
      { key: "air_source_heat_pump_55_45", value: 1 },
      { key: "air_source_heat_pump_lt_40", value: 1 },
      { key: "ground_source_heat_pump_55_45", value: 1 },
      { key: "ground_source_heat_pump_lt_40", value: 1 },
      { key: "oil_fired_single_stove", value: 0 },
      { key: "gas_space_heater", value: 0 },
      { key: "electric_direct_heater", value: 1 },
      { key: "gas_heat_pump_hybrid", value: 0.65 },
    ],
    hasInternalGains: [
      { key: "standard_boiler_70_55", value: false },
      { key: "low_temperature_boiler_oil_gas_70_55", value: false },
      { key: "condensing_boiler_70_55", value: false },
      { key: "improved_condensing_boiler_55_45", value: false },
      { key: "district_heating_all_temperatures", value: false },
      { key: "air_source_heat_pump_55_45", value: true },
      { key: "air_source_heat_pump_lt_40", value: true },
      { key: "ground_source_heat_pump_55_45", value: true },
      { key: "ground_source_heat_pump_lt_40", value: true },
      { key: "oil_fired_single_stove", value: false },
      { key: "gas_space_heater", value: false },
      { key: "electric_direct_heater", value: false },
      { key: "gas_heat_pump_hybrid", value: true },
    ],
    internalGainsFactorByBuildingType: [
      { key: BuildingType.SINGLE_FAMILY, value: 0.65 },
      { key: BuildingType.MULTI_FAMILY, value: 0.5 },
    ],

    heatingPerformanceFactor: [
      {
        key: "standard_boiler_70_55",
        value: [
          {
            to: 1986,
            value: {
              points: [
                { at: 150, value: 1.47 },
                { at: 500, value: 1.36 },
                { at: 2500, value: 1.28 },
              ],
            },
          },
          {
            from: 1987,
            to: 1994,
            value: {
              points: [
                { at: 150, value: 1.34 },
                { at: 500, value: 1.26 },
                { at: 2500, value: 1.19 },
              ],
            },
          },
          {
            from: 1995,
            value: {
              points: [
                { at: 150, value: 1.33 },
                { at: 500, value: 1.23 },
                { at: 2500, value: 1.16 },
              ],
            },
          },
        ],
      },
      {
        key: "low_temperature_boiler_oil_gas_70_55",
        value: [
          {
            to: 1986,
            value: {
              points: [
                { at: 150, value: 1.24 },
                { at: 500, value: 1.21 },
                { at: 2500, value: 1.18 },
              ],
            },
          },
          {
            from: 1987,
            to: 1994,
            value: {
              points: [
                { at: 150, value: 1.19 },
                { at: 500, value: 1.15 },
                { at: 2500, value: 1.13 },
              ],
            },
          },
          {
            from: 1995,
            value: {
              points: [
                { at: 150, value: 1.14 },
                { at: 500, value: 1.11 },
                { at: 2500, value: 1.09 },
              ],
            },
          },
        ],
      },
      {
        key: "condensing_boiler_70_55",
        value: [
          {
            to: 1986,
            value: {
              points: [
                { at: 150, value: 1.11 },
                { at: 500, value: 1.09 },
                { at: 2500, value: 1.07 },
              ],
            },
          },
          {
            from: 1987,
            to: 1994,
            value: {
              points: [
                { at: 150, value: 1.09 },
                { at: 500, value: 1.06 },
                { at: 2500, value: 1.04 },
              ],
            },
          },
          {
            from: 1995,
            value: {
              points: [
                { at: 150, value: 1.07 },
                { at: 500, value: 1.05 },
                { at: 2500, value: 1.04 },
              ],
            },
          },
        ],
      },
      {
        key: "improved_condensing_boiler_55_45",
        value: [
          {
            value: {
              points: [
                { at: 150, value: 0.99 },
                { at: 500, value: 0.98 },
                { at: 2500, value: 0.97 },
              ],
            },
          },
        ],
      },
      {
        key: "district_heating_all_temperatures",
        value: [
          {
            value: 1.02,
          },
        ],
      },
      {
        key: "air_source_heat_pump_55_45",
        value: [
          {
            to: 1994,
            value: 0.45,
          },
          {
            from: 1995,
            value: 0.43,
          },
        ],
      },
      {
        key: "air_source_heat_pump_lt_40",
        value: [
          {
            to: 1994,
            value: 0.4,
          },
          {
            from: 1995,
            value: 0.38,
          },
        ],
      },
      {
        key: "ground_source_heat_pump_55_45",
        value: [
          {
            to: 1994,
            value: 0.36,
          },
          {
            from: 1995,
            value: 0.3,
          },
        ],
      },
      {
        key: "ground_source_heat_pump_lt_40",
        value: [
          {
            to: 1994,
            value: 0.32,
          },
          {
            from: 1995,
            value: 0.27,
          },
        ],
      },
      {
        key: "oil_fired_single_stove",
        value: [
          {
            value: 1.4,
          },
        ],
      },
      {
        key: "gas_space_heater",
        value: [
          {
            value: 1.47,
          },
        ],
      },
      {
        key: "electric_direct_heater",
        value: [
          {
            value: 1.02,
          },
        ],
      },
      {
        key: "gas_heat_pump_hybrid",
        value: [
          {
            value: 0.62,
          },
        ],
      },
    ],
    temperatureControlPerformanceFactor: [
      {
        key: "standard_boiler_70_55",
        value: [
          {
            to: 1986,
            value: [
              { key: "radiant_surface_heating", value: 1.128 },
              { key: "free_heat_emitter", value: 1.128 },
            ],
          },
          {
            from: 1987,
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.104 },
              { key: "free_heat_emitter", value: 1.104 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
        ],
      },
      {
        key: "low_temperature_boiler_oil_gas_70_55",
        value: [
          {
            to: 1986,
            value: [
              { key: "radiant_surface_heating", value: 1.104 },
              { key: "free_heat_emitter", value: 1.104 },
            ],
          },
          {
            from: 1987,
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
        ],
      },
      {
        key: "condensing_boiler_70_55",
        value: [
          {
            to: 1986,
            value: [
              { key: "radiant_surface_heating", value: 1.104 },
              { key: "free_heat_emitter", value: 1.104 },
            ],
          },
          {
            from: 1987,
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
        ],
      },
      {
        key: "improved_condensing_boiler_55_45",
        value: [
          {
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
        ],
      },
      {
        key: "district_heating_all_temperatures",
        value: [
          {
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.063 },
            ],
          },
        ],
      },
      {
        key: "air_source_heat_pump_55_45",
        value: [
          {
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.057 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.051 },
              { key: "free_heat_emitter", value: 1.045 },
            ],
          },
        ],
      },
      {
        key: "air_source_heat_pump_lt_40",
        value: [
          {
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.054 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.051 },
              { key: "free_heat_emitter", value: 1.042 },
            ],
          },
        ],
      },
      {
        key: "ground_source_heat_pump_55_45",
        value: [
          {
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.057 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.051 },
              { key: "free_heat_emitter", value: 1.045 },
            ],
          },
        ],
      },
      {
        key: "ground_source_heat_pump_lt_40",
        value: [
          {
            to: 1994,
            value: [
              { key: "radiant_surface_heating", value: 1.063 },
              { key: "free_heat_emitter", value: 1.054 },
            ],
          },
          {
            from: 1995,
            value: [
              { key: "radiant_surface_heating", value: 1.051 },
              { key: "free_heat_emitter", value: 1.042 },
            ],
          },
        ],
      },
      {
        key: "oil_fired_single_stove",
        value: [
          {
            value: [
              { key: "radiant_surface_heating", value: 1 },
              { key: "free_heat_emitter", value: 1 },
            ],
          },
        ],
      },
      {
        key: "gas_space_heater",
        value: [
          {
            value: [
              { key: "radiant_surface_heating", value: 1 },
              { key: "free_heat_emitter", value: 1 },
            ],
          },
        ],
      },
      {
        key: "electric_direct_heater",
        value: [
          {
            value: [
              { key: "radiant_surface_heating", value: 1 },
              { key: "free_heat_emitter", value: 1 },
            ],
          },
        ],
      },
      {
        key: "gas_heat_pump_hybrid",
        value: [
          {
            value: [
              { key: "radiant_surface_heating", value: 1.055 },
              { key: "free_heat_emitter", value: 1.051 },
            ],
          },
        ],
      },
    ],
    innerSurfaceThermalResistance: [
      { key: HeatFlowDirection.UPWARD, value: 0.1 },
      { key: HeatFlowDirection.HORIZONTAL, value: 0.13 },
      { key: HeatFlowDirection.DOWNWARD, value: 0.17 },
    ],
    outerSurfaceThermalResistance: [
      { key: HeatFlowDirection.UPWARD, value: 0.04 },
      { key: HeatFlowDirection.HORIZONTAL, value: 0.04 },
      { key: HeatFlowDirection.DOWNWARD, value: 0.04 },
    ],
  },
  roof: {
    heatLossFactor: 1,
    defaultInsulationType: RoofInsulationType.ABOVE_RAFTER,
    constructionTypes: [
      {
        value: "solid_construction",
        localization: {
          de: "Massive Konstruktion",
          en: "Solid construction",
        },
      },
      {
        value: "wood_construction",
        localization: {
          de: "Holzkonstruktion",
          en: "Wood construction",
        },
      },
    ],
    defaultIsFlatRoof: false,
    defaultConstructionTypeByIsFlatRoof: [
      { key: true, value: "solid_construction" },
      { key: false, value: "wood_construction" },
    ],
    assumedInsulationThickness: 0.2,
    thermalConductivity: 0.04,
    insulationReductionFactor: 0.3,
    uValue: [
      {
        key: "solid_construction",
        value: [
          { to: 1957, value: 2.1 },
          { from: 1958, to: 1978, value: 1.3 },
          { from: 1979, to: 1983, value: 0.6 },
          { from: 1984, to: 1994, value: 0.4 },
          { from: 1995, to: 2001, value: 0.3 },
          { from: 2002, value: 0.2 },
        ],
      },
      {
        key: "wood_construction",
        value: [
          { to: 1918, value: 2.6 },
          { from: 1919, to: 1968, value: 1.4 },
          { from: 1969, to: 1978, value: 0.8 },
          { from: 1979, to: 1983, value: 0.7 },
          { from: 1984, to: 1994, value: 0.5 },
          { from: 1995, to: 2001, value: 0.3 },
          { from: 2002, value: 0.2 },
        ],
      },
    ],
  },
  topFloor: {
    topFloorTypes: [
      {
        value: "solid_ceiling",
        localization: {
          de: "Massive Decke",
          en: "Solid ceiling",
        },
      },
      {
        value: "wood_beam_ceiling",
        localization: {
          de: "Holzbalkendecke",
          en: "Wood beam ceiling",
        },
      },
    ],
    defaultTopFloorType: [
      { to: 1968, value: "wood_beam_ceiling" },
      { from: 1969, value: "solid_ceiling" },
    ],
    defaultHasAtticByIsFlatRoof: [
      { key: true, value: false },
      { key: false, value: true },
    ],
    defaultIsAtticHeated: false,
    thermalConductivity: 0.032,
    assumedInsulationThickness: 0.24,
    heatLossFactor: 1,
    uValue: [
      {
        key: "solid_ceiling",
        value: [
          { to: 1968, value: 2.1 },
          { from: 1969, to: 1983, value: 0.6 },
          { from: 1984, to: 2001, value: 0.3 },
          { from: 2002, value: 0.2 },
        ],
      },
      {
        key: "wood_beam_ceiling",
        value: [
          { to: 1948, value: 1 },
          { from: 1949, to: 1957, value: 0.8 },
          { from: 1958, to: 1968, value: 0.7 },
          { from: 1969, to: 1978, value: 0.6 },
          { from: 1979, to: 1983, value: 0.4 },
          { from: 1984, value: 0.3 },
        ],
      },
    ],
  },
  outerWall: {
    constructionTypes: [
      {
        value: "brick_wall",
        localization: {
          de: "Massivwand über 30cm Wandstärke",
          en: "Solid wall over 30cm thickness",
        },
      },
      {
        value: "other_wall",
        localization: {
          de: "Massivwand bis 30cm Wandstärke",
          en: "Solid wall up to 30cm thickness",
        },
      },
      {
        value: "solid_wall_with_thermal_insulation_composite_system",
        localization: {
          de: "Massivwand mit Wärmedämmverbundsystem",
          en: "Solid wall with thermal insulation composite system",
        },
        allowsAdditionalInsulation: false,
      },
    ],
    defaultConstructionType: [
      { to: 1957, value: "brick_wall" },
      { from: 1958, to: 2006, value: "other_wall" },
      {
        from: 2007,
        value: "solid_wall_with_thermal_insulation_composite_system",
      },
    ],
    thermalConductivity: 0.035,
    assumedInsulationThickness: 0.14,
    heatLossFactor: 1,
    uValue: [
      {
        key: "brick_wall",
        value: [{ value: 1.5 }],
      },
      {
        key: "other_wall",
        value: [
          { to: 1968, value: 1.4 },
          { from: 1969, to: 1978, value: 1.0 },
          { from: 1979, to: 1983, value: 0.8 },
          { from: 1984, to: 1994, value: 0.6 },
          { from: 1995, to: 2001, value: 0.5 },
          { from: 2002, value: 0.4 },
        ],
      },
      {
        key: "solid_wall_with_thermal_insulation_composite_system",
        value: [{ value: 0.2 }],
      },
    ],
  },
  bottomFloor: {
    constructionTypes: [
      {
        value: "reinforced_concrete_on_ground",
        localization: {
          de: "Boden gegen Erdreich, Stahlbeton massiv",
          en: "Floor slab on ground, solid reinforced concrete",
        },
      },
      {
        value: "reinforced_concrete_ceiling",
        localization: {
          de: "Kellerdecke Stahlbeton massiv",
          en: "Basement ceiling, solid reinforced concrete",
        },
      },
      {
        value: "timber_joist_ceiling",
        localization: {
          de: "Kellerdecke als Holzbalkendecke",
          en: "Basement ceiling as a timber joist ceiling",
        },
      },
    ],

    allowedConstructionTypesByHeatedCellar: [
      {
        key: true,
        allowedValues: ["reinforced_concrete_on_ground"],
      },
      {
        key: false,
        allowedValues: ["timber_joist_ceiling", "reinforced_concrete_ceiling"],
      },
    ],

    defaultConstructionType: [
      {
        key: true,
        value: [{ value: "reinforced_concrete_on_ground" }],
      },
      {
        key: false,
        value: [
          { to: 1968, value: "timber_joist_ceiling" },
          { from: 1969, value: "reinforced_concrete_ceiling" },
        ],
      },
    ],
    thermalConductivity: 0.03,
    assumedInsulationThickness: 0.12,
    heatLossFactor: 1,
    uValue: [
      {
        key: "reinforced_concrete_on_ground",
        value: [
          { to: 1918, value: 1.6 },
          { from: 1919, to: 1948, value: 1.6 },
          { from: 1949, to: 1957, value: 2.3 },
          { from: 1958, to: 1968, value: 1.2 },
          { from: 1969, to: 1978, value: 1.2 },
          { from: 1979, to: 1983, value: 0.8 },
          { from: 1984, to: 1994, value: 0.6 },
          { from: 1995, to: 2001, value: 0.6 },
          { from: 2002, value: 0.5 },
        ],
      },
      {
        key: "reinforced_concrete_ceiling",
        value: [
          { to: 1918, value: 1.6 },
          { from: 1919, to: 1948, value: 1.6 },
          { from: 1949, to: 1957, value: 2.3 },
          { from: 1958, to: 1968, value: 1.0 },
          { from: 1969, to: 1978, value: 1.0 },
          { from: 1979, to: 1983, value: 0.8 },
          { from: 1984, to: 1994, value: 0.6 },
          { from: 1995, to: 2001, value: 0.6 },
          { from: 2002, value: 0.5 },
        ],
      },
      {
        key: "timber_joist_ceiling",
        value: [
          { to: 1918, value: 1.0 },
          { from: 1919, to: 1948, value: 1.0 },
          { from: 1949, to: 1957, value: 1.0 },
          { from: 1958, to: 1968, value: 0.8 },
          { from: 1969, to: 1978, value: 0.6 },
          { from: 1979, to: 1983, value: 0.6 },
          { from: 1984, to: 1994, value: 0.4 },
          { from: 1995, to: 2001, value: 0.4 },
          { from: 2002, value: 0.4 },
        ],
      },
    ],
  },
  windows: {
    windowTypes: [
      {
        value: "wooden_window_single_glazing",
        localization: {
          de: "Holzfenster, einfach verglast",
          en: "Wooden window, single glazing",
        },
      },
      {
        value: "wooden_window_double_glazing",
        localization: {
          de: "Holzfenster, zweifach verglast",
          en: "Wooden window, double glazing",
        },
      },
      {
        value: "plastic_window_insulated_glazing",
        localization: {
          de: "Kunststofffenster, Isolierverglasung",
          en: "Plastic window, insulated glazing",
        },
      },
      {
        value: "aluminum_or_steel_window_insulated_glazing",
        localization: {
          de: "Aluminium- oder Stahlfenster, Isolierverglasung",
          en: "Aluminum or steel window, insulated glazing",
        },
      },
    ],
    defaultWindowType: [
      { to: 1983, value: "wooden_window_double_glazing" },
      { from: 1984, value: "plastic_window_insulated_glazing" },
    ],
    uValue: [
      {
        key: "wooden_window_single_glazing",
        value: [{ value: 5.0 }],
      },
      {
        key: "wooden_window_double_glazing",
        value: [
          { to: 1994, value: 2.7 },
          { from: 1995, to: 2001, value: 1.6 },
          { from: 2002, value: 1.5 },
        ],
      },
      {
        key: "plastic_window_insulated_glazing",
        value: [
          { to: 1994, value: 3.0 },
          { from: 1995, to: 2001, value: 1.9 },
          { from: 2002, value: 1.5 },
        ],
      },
      {
        key: "aluminum_or_steel_window_insulated_glazing",
        value: [
          { to: 1983, value: 4.3 },
          { from: 1984, to: 1994, value: 3.2 },
          { from: 1995, to: 2001, value: 1.9 },
          { from: 2002, value: 1.5 },
        ],
      },
    ],
    roofWindowsHeatLossFactor: 0.93,
    exteriorWallWindowsHeatLossFactor: 1,
    exteriorWallAreaFactor: 0.2,
    roofAreaFactor: 0.1,
  },
  renovation: {
    heatingRenovations: [
      {
        targetCarrier: "none",
        targetSystem: "air_source_heat_pump_lt_40",
        priority: 1,
      },
      {
        targetCarrier: "none",
        targetSystem: "ground_source_heat_pump_lt_40",
        priority: 1,
      },
      {
        targetCarrier: "wood_pellets",
        targetSystem: "standard_boiler_70_55",
        priority: 2,
      },
      {
        targetCarrier: "bio_gas",
        targetSystem: "improved_condensing_boiler_55_45",
        priority: 3,
      },
      {
        targetCarrier: "district_heating",
        targetSystem: "district_heating_all_temperatures",
        priority: 3,
      },
    ],
    heatingRenovationLabelTemplates: {
      carrierAndSystem: {
        de: "Wechsel zu {{system}} mit Energieträger {{carrier}}",
        en: "Switch to {{system}} using {{carrier}}",
      },
      carrierOnly: {
        de: "Energieträger auf {{carrier}} umstellen",
        en: "Switch energy carrier to {{carrier}}",
      },
      systemOnly: {
        de: "Heizungssystem auf {{system}} umstellen",
        en: "Switch heating system to {{system}}",
      },
    },
    heatingSurfaceRenovations: [
      {
        localization: {
          de: "Wechsel zu Flächenheizung",
          en: "Switch to radiant surface heating",
        },
        targetSurfaceType: "radiant_surface_heating",
        recommendedForSystems: [
          "air_source_heat_pump_55_45",
          "air_source_heat_pump_lt_40",
          "ground_source_heat_pump_55_45",
          "ground_source_heat_pump_lt_40",
          "gas_heat_pump_hybrid",
        ],
      },
    ],
    insulationRenovations: {
      bottomFloor: { uValue: 0.25, recommendYearRange: { to: 1986 } },
      roof: { uValue: 0.14, recommendYearRange: { to: 2006 } },
      topFloor: { uValue: 0.14, recommendYearRange: { to: 1986 } },
      outerWalls: { uValue: 0.2, recommendYearRange: { to: 1978 } },
      outerWindows: { uValue: 0.95, recommendYearRange: { to: 1994 } },
      roofWindows: { uValue: 1, recommendYearRange: { to: 1994 } },
    },
    primaryEnergyCarrierTargets: ["heating_oil", "natural_gas", "bio_gas"],
  },
};
