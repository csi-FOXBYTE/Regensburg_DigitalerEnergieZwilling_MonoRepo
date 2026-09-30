import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";

import { generateDetBuildingEnergyProfileArtifacts } from "../../src/model/det-building-energy-profile.generator.js";

type JsonObject = { [key: string]: unknown };

async function readJson(path: string): Promise<JsonObject> {
  return JSON.parse(await readFile(path, "utf8")) as JsonObject;
}

test("generateDetBuildingEnergyProfileArtifacts writes deterministic artifacts from config", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "det-building-energy-profile-"));

  try {
    const outputDir = await generateDetBuildingEnergyProfileArtifacts({
      cwd,
      config: {
        outputDir: "generated/model",
        contextUrl: "https://example.test/context.jsonld",
        namespace: "https://example.test/model#",
        schemaId: "https://example.test/schema.json",
        description: "Test description",
      },
    });

    assert.equal(outputDir, join(cwd, "generated/model"));

    const context = await readJson(join(outputDir, "context.jsonld"));
    const example = await readJson(join(outputDir, "example.jsonld"));
    const keyValues = await readJson(join(outputDir, "example-keyvalues.json"));
    const schema = await readJson(join(outputDir, "schema.json"));

    const contextValues = context["@context"] as JsonObject;
    assert.equal(
      contextValues.DETBuildingEnergyProfile,
      "https://example.test/model#DETBuildingEnergyProfile",
    );
    assert.equal(
      contextValues.annualTotalEnergyDemand,
      "https://example.test/model#annualTotalEnergyDemand",
    );

    assert.deepEqual(example["@context"], [
      "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
      "https://example.test/context.jsonld",
    ]);
    assert.deepEqual(example.annualTotalEnergyDemand, {
      type: "Property",
      value: 12000,
      unitCode: "KWH",
    });
    assert.deepEqual(example.annualTotalCost, {
      type: "Property",
      value: 2500,
    });

    assert.equal(keyValues.annualTotalEnergyDemand, 12000);
    assert.equal(keyValues.heatingSystemType, "standard_boiler_70_55");

    assert.equal(schema.$id, "https://example.test/schema.json");
    assert.equal(schema.description, "Test description");
    assert.deepEqual(schema.required, ["id", "type"]);

    const schemaProperties = schema.properties as JsonObject;
    assert.deepEqual(schemaProperties.annualTotalEnergyDemand, {
      type: "number",
      description:
        "Total annual energy demand of the building, including heating-related energy and electrical energy use.",
    });
    assert.deepEqual(schemaProperties.heatingSystemType, {
      type: "string",
      description: "Heating system type used for the building energy profile.",
    });

    assert.equal(await readFile(join(outputDir, "schema.json"), "utf8").then((content) => content.endsWith("\n")), true);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
