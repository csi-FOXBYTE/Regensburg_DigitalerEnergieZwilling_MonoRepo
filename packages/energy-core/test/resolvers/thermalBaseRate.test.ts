import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { thermalBaseRate as resolver } from "../../src/calculators/energy/resolvers/thermalEnergy.js";
import { mockCtx } from "../helpers/mock-ctx.js";
import type { PrimaryEnergyCarrierData } from "../../src/types/config/heat.js";
import type { PreRenovationValues } from "../../src/types/input/preRenovation.js";

const CONFIG_BASE_RATE = 181.83;
const USER_BASE_RATE = 250;
const CARRIER = "natural_gas";

const carrierData: Pick<PrimaryEnergyCarrierData, "baseRate"> = { baseRate: CONFIG_BASE_RATE };

function ctx(
  userThermalBaseRate: number | null | undefined,
  preRenovationValues?: PreRenovationValues | null,
  currentCarrier = CARRIER,
) {
  return mockCtx(
    { userThermalBaseRate },
    { primaryEnergyCarrier: currentCarrier, primaryEnergyCarrierData: carrierData as PrimaryEnergyCarrierData },
    preRenovationValues,
  );
}

const baseBundle = (carrier: string): PreRenovationValues => ({
  primaryEnergyCarrier: carrier,
  totalEnergyDemand: 20000,
  heatingSystemType: "standard_boiler_70_55",
  electricityOffset: 0,
  hadInternalGains: false,
});

describe("thermalBaseRate", () => {
  test("returns config baseRate when no user override", () => {
    assert.strictEqual(resolver.resolve(ctx(undefined)), CONFIG_BASE_RATE);
    assert.strictEqual(resolver.resolve(ctx(null)), CONFIG_BASE_RATE);
  });

  test("returns user override when no pre-renovation bundle", () => {
    assert.strictEqual(resolver.resolve(ctx(USER_BASE_RATE)), USER_BASE_RATE);
  });

  test("returns user override when bundle present and carrier is unchanged", () => {
    assert.strictEqual(
      resolver.resolve(ctx(USER_BASE_RATE, baseBundle(CARRIER), CARRIER)),
      USER_BASE_RATE,
    );
  });

  test("returns config rate when bundle present and carrier switched", () => {
    // pre-renovation was heating_oil, now natural_gas — user's rate was for heating_oil
    assert.strictEqual(
      resolver.resolve(ctx(USER_BASE_RATE, baseBundle("heating_oil"), CARRIER)),
      CONFIG_BASE_RATE,
    );
  });
});
