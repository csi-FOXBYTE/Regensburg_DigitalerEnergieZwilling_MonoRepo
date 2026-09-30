import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  generateHeatingRenovations,
  generateHeatingSurfaceRenovations,
  generateInsulationRenovations,
} from "../../src/types/renovation/generate.js";
import type { InsulationRenovationKeys } from "../../src/types/renovation/renovation.js";
import { DEFAULT_CONFIG } from "../../src/types/config/default-config.js";
import { baseConfig, baseInput } from "../validators/fixtures.js";

function generate(input = baseInput()) {
  return generateInsulationRenovations(
    baseConfig(),
    input,
    (key: InsulationRenovationKeys) => key,
  );
}

function renovationIds(input = baseInput()): string[] {
  return generate(input).map((renovation) => renovation.id);
}

describe("generateInsulationRenovations — roof boundary", () => {
  test("shows roof but not top-floor renovation when there is no attic", () => {
    const input = baseInput();
    input.topFloor.hasAttic = false;
    input.topFloor.isAtticHeated = true;

    const ids = renovationIds(input);

    assert.ok(ids.includes("envelope_roof"));
    assert.ok(!ids.includes("envelope_topFloor"));
  });

  test("shows roof but not top-floor renovation when the attic is heated", () => {
    const input = baseInput();
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = true;

    const ids = renovationIds(input);

    assert.ok(ids.includes("envelope_roof"));
    assert.ok(!ids.includes("envelope_topFloor"));
  });

  test("shows top-floor but not roof renovation when the attic is unheated", () => {
    const input = baseInput();
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = false;

    const ids = renovationIds(input);

    assert.ok(!ids.includes("envelope_roof"));
    assert.ok(ids.includes("envelope_topFloor"));
  });

  test("does not show roof-window renovation when the attic is unheated", () => {
    const input = baseInput();
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = false;

    const ids = renovationIds(input);

    assert.ok(!ids.includes("envelope_roofWindows"));
  });

  test("shows roof-window renovation when the roof renovation is shown", () => {
    const input = baseInput();
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = true;

    const ids = renovationIds(input);

    assert.ok(ids.includes("envelope_roof"));
    assert.ok(ids.includes("envelope_roofWindows"));
  });
});

describe("generateInsulationRenovations — insulation recommendation", () => {
  test("uses the resolved building year for roof windows when their year is omitted", () => {
    const input = baseInput();
    input.general.buildingYear = 1990;
    input.roofWindows.year = undefined;
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = true;

    const renovation = generate(input).find(
      (entry) => entry.id === "envelope_roofWindows",
    );

    assert.equal(renovation?.recommended, true);
  });

  test("uses resolved building years for the remaining envelope components", () => {
    const input = baseInput();
    input.general.buildingYear = 1990;
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = true;

    const renovations = new Map(
      generate(input).map((renovation) => [renovation.id, renovation]),
    );

    assert.equal(renovations.get("envelope_roof")?.recommended, true);
    assert.equal(renovations.get("envelope_bottomFloor")?.recommended, true);
    assert.equal(renovations.get("envelope_outerWalls")?.recommended, true);
    assert.equal(renovations.get("envelope_outerWindows")?.recommended, true);
  });

  test("uses the resolved building year for the top floor", () => {
    const input = baseInput();
    input.general.buildingYear = 1990;
    input.topFloor.hasAttic = true;
    input.topFloor.isAtticHeated = false;

    const renovation = generate(input).find(
      (entry) => entry.id === "envelope_topFloor",
    );

    assert.equal(renovation?.recommended, true);
  });

  test("uses the year fallback when hasInsulation is false", () => {
    const oldInput = baseInput();
    oldInput.bottomFloor.hasInsulation = false;
    oldInput.bottomFloor.year = 1970;

    const recentInput = baseInput();
    recentInput.bottomFloor.hasInsulation = false;
    recentInput.bottomFloor.year = 1990;

    const oldRenovation = generate(oldInput).find(
      (renovation) => renovation.id === "envelope_bottomFloor",
    );
    const recentRenovation = generate(recentInput).find(
      (renovation) => renovation.id === "envelope_bottomFloor",
    );

    assert.equal(oldRenovation?.recommended, false);
    assert.equal(recentRenovation?.recommended, true);
  });

  test("uses the year fallback when hasInsulation is unknown", () => {
    const oldInput = baseInput();
    oldInput.bottomFloor.year = 1970;

    const recentInput = baseInput();
    recentInput.bottomFloor.year = 1990;

    const oldRenovation = generate(oldInput).find(
      (renovation) => renovation.id === "envelope_bottomFloor",
    );
    const recentRenovation = generate(recentInput).find(
      (renovation) => renovation.id === "envelope_bottomFloor",
    );

    assert.equal(oldRenovation?.recommended, false);
    assert.equal(recentRenovation?.recommended, true);
  });

  test("does not recommend when hasInsulation is true", () => {
    const input = baseInput();
    input.bottomFloor.hasInsulation = true;
    input.bottomFloor.year = 1990;

    const renovation = generate(input).find(
      (entry) => entry.id === "envelope_bottomFloor",
    );

    assert.equal(renovation?.recommended, false);
  });
});

describe("generateHeatingSurfaceRenovations — resolved defaults", () => {
  test("uses the resolved default heating system for recommendations", () => {
    const input = baseInput();
    input.heat.primaryEnergyCarrier = "none";
    input.heat.heatingSystemType = null;
    input.heat.heatingSurfaceType = null;

    const renovation = generateHeatingSurfaceRenovations(
      DEFAULT_CONFIG,
      input,
      "en",
    ).find((entry) => entry.id === "surface_radiant_surface_heating");

    assert.equal(renovation?.recommended, true);
  });

  test("does not offer the resolved default heating surface", () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.heat.defaultHeatingSurfaceType = "radiant_surface_heating";
    const input = baseInput();
    input.heat.heatingSurfaceType = null;

    const renovations = generateHeatingSurfaceRenovations(config, input, "en");

    assert.ok(
      !renovations.some(
        (entry) => entry.id === "surface_radiant_surface_heating",
      ),
    );
  });
});

describe("generateHeatingRenovations — system renewal opt-out", () => {
  function hasRenewal(
    config = baseConfig(),
    input = baseInput(),
  ): boolean {
    return generateHeatingRenovations(config, input, "de", "Renew system").some(
      (renovation) => renovation.id === "heat_renew",
    );
  }

  test("generates renewal when neither carrier nor system opts out", () => {
    assert.equal(hasRenewal(), true);
  });

  test("does not generate renewal when the resolved carrier opts out", () => {
    const config = baseConfig();
    config.heat.primaryEnergyCarriers[0]!.excludeFromSystemRenewal = true;

    assert.equal(hasRenewal(config), false);
  });

  test("does not generate renewal when the resolved system opts out", () => {
    const config = baseConfig();
    config.heat.heatingSystemTypes[0]!.excludeFromSystemRenewal = true;

    assert.equal(hasRenewal(config), false);
  });

  test("generates renewal for the resolved natural-gas defaults", () => {
    const input = baseInput();
    input.heat.primaryEnergyCarrier = null;
    input.heat.heatingSystemType = null;

    assert.equal(hasRenewal(DEFAULT_CONFIG, input), true);
  });
});

describe("generateHeatingRenovations — matching systems and generated labels", () => {
  function configWithHeatingRenovations() {
    const config = baseConfig();
    config.heat.primaryEnergyCarriers[0]!.localization = { de: "Erdgas" };
    config.heat.primaryEnergyCarriers.push({ value: "bio_gas", localization: { de: "Biogas" } });
    config.heat.heatingSystemTypes[0]!.localization = { de: "Standardkessel" };
    config.heat.heatingSystemTypes.push({ value: "condensing_boiler", localization: { de: "Brennwertkessel" } });
    config.renovation.heatingRenovations = [
      { targetCarrier: "gas", targetSystem: "boiler", priority: 1 },
      { targetCarrier: "bio_gas", targetSystem: "boiler", priority: 2 },
      { targetCarrier: "gas", targetSystem: "condensing_boiler", priority: 3 },
      { targetCarrier: "bio_gas", targetSystem: "condensing_boiler", priority: 4 },
    ];
    config.renovation.heatingRenovationLabelTemplates = {
      carrierAndSystem: { de: "{{system}} mit {{carrier}}" },
      carrierOnly: { de: "Energieträger: {{carrier}}" },
      systemOnly: { de: "Heizungssystem: {{system}}" },
    };
    return config;
  }

  test("removes an exact resolved carrier/system match before choosing priority", () => {
    const renovations = generateHeatingRenovations(configWithHeatingRenovations(), baseInput(), "de");

    assert.ok(!renovations.some((renovation) => renovation.id === "heat_gas_boiler"));
    assert.equal(renovations.find((renovation) => renovation.id === "heat_bio_gas_boiler")?.recommended, true);
    assert.equal(renovations.find((renovation) => renovation.id === "heat_gas_condensing_boiler")?.recommended, false);
  });

  test("generates labels for carrier-only, system-only, and combined changes", () => {
    const renovations = generateHeatingRenovations(configWithHeatingRenovations(), baseInput(), "de");
    const labels = new Map(renovations.map((renovation) => [renovation.id, renovation.label]));

    assert.equal(labels.get("heat_bio_gas_boiler"), "Energieträger: Biogas");
    assert.equal(labels.get("heat_gas_condensing_boiler"), "Heizungssystem: Brennwertkessel");
    assert.equal(labels.get("heat_bio_gas_condensing_boiler"), "Brennwertkessel mit Biogas");
  });
});

describe("generateHeatingRenovations — gas supply", () => {
  function heatingRenovationIds(hasGasSupply?: boolean): string[] {
    const input = baseInput();
    input.heat.hasGasSupply = hasGasSupply;
    return generateHeatingRenovations(DEFAULT_CONFIG, input, "en").map(
      (renovation) => renovation.id,
    );
  }

  test("offers biogas when a gas supply is available", () => {
    const ids = heatingRenovationIds(true);

    assert.ok(ids.includes("heat_bio_gas_improved_condensing_boiler_55_45"));
    assert.ok(!ids.includes("heat_natural_gas_improved_condensing_boiler_55_45"));
  });

  test("offers biogas when gas supply availability is omitted", () => {
    const ids = heatingRenovationIds();

    assert.ok(ids.includes("heat_bio_gas_improved_condensing_boiler_55_45"));
    assert.ok(!ids.includes("heat_natural_gas_improved_condensing_boiler_55_45"));
  });

  test("does not offer a gas renovation when a gas supply is unavailable", () => {
    const ids = heatingRenovationIds(false);

    assert.ok(!ids.includes("heat_bio_gas_improved_condensing_boiler_55_45"));
    assert.ok(!ids.includes("heat_natural_gas_improved_condensing_boiler_55_45"));
  });
});

describe("generateHeatingRenovations — geothermal availability", () => {
  function heatingRenovationIds(hasGeothermalAvailability?: boolean): string[] {
    const input = baseInput();
    input.heat.hasGeothermalAvailability = hasGeothermalAvailability;
    return generateHeatingRenovations(DEFAULT_CONFIG, input, "en").map(
      (renovation) => renovation.id,
    );
  }

  test("offers ground-source and air-source heat pumps when geothermal energy is available", () => {
    const ids = heatingRenovationIds(true);

    assert.ok(ids.includes("heat_none_ground_source_heat_pump_lt_40"));
    assert.ok(ids.includes("heat_none_air_source_heat_pump_lt_40"));
  });

  test("does not offer a ground-source heat pump when geothermal energy is unavailable", () => {
    const ids = heatingRenovationIds(false);

    assert.ok(!ids.includes("heat_none_ground_source_heat_pump_lt_40"));
    assert.ok(ids.includes("heat_none_air_source_heat_pump_lt_40"));
  });

  test("assumes geothermal energy is unavailable when availability is omitted", () => {
    const ids = heatingRenovationIds();

    assert.ok(!ids.includes("heat_none_ground_source_heat_pump_lt_40"));
    assert.ok(ids.includes("heat_none_air_source_heat_pump_lt_40"));
  });
});
