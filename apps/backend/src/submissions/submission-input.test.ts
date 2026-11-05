import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  DEFAULT_CONFIG,
  DETInputSchema,
  validateInput,
} from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import type { TSchema } from "@sinclair/typebox";
import { createGuardedTestApp } from "../lib/guarded-test-app.js";
import submissionsPublicController from "../submissionsPublic/submissionsPublic.controller.js";
import { coreBaseInput, publicClientInput, validSubmission } from "./submission-input.fixture.js";
import { maxYear, SubmissionCalculationInputDto } from "./submission-input.dto.js";

type ZodLike = { shape?: Record<string, ZodLike>; unwrap?: () => ZodLike };
const zodKeys = (schema: ZodLike): string[] => {
  let current = schema;
  while (!current.shape && current.unwrap) current = current.unwrap();
  return Object.keys(current.shape ?? {}).sort();
};

type ObjectSchema = TSchema & { properties?: Record<string, TSchema>; anyOf?: TSchema[] };
const typeboxKeys = (schema: ObjectSchema): string[] => {
  const object = schema.properties ? schema : (schema.anyOf as ObjectSchema[]).find((s) => s.properties)!;
  return Object.keys(object.properties!).sort();
};

const createApp = async () => {
  const submit = mock.fn(async (_params: { input: unknown }) => ({ deletionToken: "opaque-token" }));
  const app = await createGuardedTestApp([submissionsPublicController], { submit });
  return { app, submit };
};

const withPath = (path: string, value: unknown) => {
  const body = validSubmission(coreBaseInput()) as Record<string, unknown>;
  const keys = path.split(".");
  let target = body;
  for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[keys[keys.length - 1]!] = value;
  return body;
};

describe("public submission input schema", () => {
  it("covers exactly the fields of the calculation core's input schema", () => {
    const sections = DETInputSchema.shape as unknown as Record<string, ZodLike>;
    const dto = SubmissionCalculationInputDto as ObjectSchema;
    assert.deepEqual(typeboxKeys(dto), zodKeys(DETInputSchema as unknown as ZodLike));
    for (const [section, schema] of Object.entries(sections))
      assert.deepEqual(typeboxKeys(dto.properties![section] as ObjectSchema), zodKeys(schema), section);
  });

  it("accepts the core fixture and what the public client sends, unchanged", async (t) => {
    const { app, submit } = await createApp();
    t.after(() => app.close());

    for (const input of [coreBaseInput(), publicClientInput()]) {
      assert.equal(validateInput(input, DEFAULT_CONFIG).success, true);
      const response = await app.inject({ method: "POST", url: "/api/public/submissions", payload: validSubmission(input) });
      assert.equal(response.statusCode, 200, response.body);
      const calls = submit.mock.calls;
      assert.deepEqual(calls[calls.length - 1]?.arguments[0].input, input);
    }

    // Boundaries stay valid: empty address (building without one), zero
    // placeholders, the extreme coordinates and the year limits.
    for (const [path, value] of [
      ["address", ""],
      ["latitude", -90],
      ["longitude", 180],
      ["input.general.buildingHeight", 0],
      ["input.general.buildingYear", 1000],
      ["input.general.buildingYear", maxYear()],
      ["input.general.buildingYear", { to: 1918 }],
      ["input.general.buildingYear", {}],
      ["input.roof.area", 1_000_000],
      ["buildingId", "b".repeat(256)],
      ["address", "a".repeat(512)],
    ] as const) {
      const response = await app.inject({ method: "POST", url: "/api/public/submissions", payload: withPath(path, value) });
      assert.equal(response.statusCode, 200, `${path}=${JSON.stringify(value)}: ${response.body}`);
    }
  });

  it("rejects out-of-range, oversized, empty and unknown values with 400 before the service", async (t) => {
    const { app, submit } = await createApp();
    t.after(() => app.close());

    const cases: [string, unknown][] = [
      ["latitude", -91],
      ["latitude", 90.5],
      ["longitude", 999],
      ["longitude", -180.1],
      ["input.general.buildingHeight", -5],
      ["input.general.buildingHeight", 1e308],
      ["input.general.buildingBaseArea", 0],
      ["input.general.buildingYear", 1],
      ["input.general.buildingYear", 999999],
      ["input.general.buildingYear", maxYear() + 1],
      ["input.general.buildingYear", { from: 1, to: 1918 }],
      ["input.general.buildingYear", { to: 1918, label: "bis 1918" }],
      ["input.general.numberOfStories", 0],
      ["input.outerWall.uValue", -1e308],
      ["input.outerWall.uValue", -1],
      ["input.bottomFloor.area", -100],
      ["input.heat.userThermalTotalCost", 1e308],
      ["input.electricity.userElectricityConsumption", 1_000_001],
      ["input.roof.constructionType", "x".repeat(129)],
      ["input.preRenovationValues", { totalEnergyDemand: -1, primaryEnergyCarrier: "gas", heatingSystemType: "boiler", electricityOffset: 0, hadInternalGains: true }],
      ["buildingId", ""],
      ["buildingId", "B".repeat(100_000)],
      ["address", "A".repeat(200_000)],
      ["configName", ""],
      ["configName", "c".repeat(257)],
      // Unknown keys are rejected instead of being stored in rawInput.
      ["input.x", "x".repeat(1000)],
      ["input.general.extra", 1],
      ["input.heat.notes", "free text"],
      ["extra", true],
      // No coercion of JSON bodies.
      ["latitude", "49.0"],
      ["input.general.buildingHeight", "6"],
      ["buildingId", 42],
    ];
    for (const [path, value] of cases) {
      const response = await app.inject({ method: "POST", url: "/api/public/submissions", payload: withPath(path, value) });
      assert.equal(response.statusCode, 400, `${path}=${JSON.stringify(value).slice(0, 40)}: ${response.body}`);
      assert.equal(response.json().status, "BAD_REQUEST");
    }
    assert.equal(submit.mock.callCount(), 0);
  });
});
