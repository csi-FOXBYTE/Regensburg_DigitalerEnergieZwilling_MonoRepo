import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  detBuildingEnergyProfileModel,
  type ModelAttributeDefinition,
  type ModelDefinition,
} from "./det-building-energy-profile.definition.js";

export type DetBuildingEnergyProfileGeneratorConfig = {
  outputDir?: string;
  contextUrl: string;
  namespace: string;
  schemaId?: string;
  description?: string;
};

export type DetBuildingEnergyProfileGeneratorOptions = {
  cwd?: string;
  config: DetBuildingEnergyProfileGeneratorConfig;
};

type JsonObject = { [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

const DEFAULT_OUTPUT_DIR = "generated/det-building-energy-profile";
const NGSI_LD_CORE_CONTEXT = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld";
const EXAMPLE_ID = "urn:ngsi-ld:DETBuildingEnergyProfile:example-001";

function stableJson(value: JsonValue): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sortedEntries<T>(record: Record<string, T>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function getAttributeIri(model: ModelDefinition, name: string, attribute: ModelAttributeDefinition): string {
  return attribute.iri ?? `${model.namespace}${name}`;
}

function withGeneratorConfig(config: DetBuildingEnergyProfileGeneratorConfig): ModelDefinition {
  return {
    ...detBuildingEnergyProfileModel,
    contextUrl: config.contextUrl,
    namespace: config.namespace,
    ...(config.schemaId !== undefined ? { schemaId: config.schemaId } : {}),
    ...(config.description !== undefined ? { description: config.description } : {}),
  };
}

function buildContext(model: ModelDefinition): JsonObject {
  const context: JsonObject = {
    [model.type]: `${model.namespace}${model.type}`,
  };

  for (const [name, attribute] of sortedEntries(model.attributes)) {
    context[name] = getAttributeIri(model, name, attribute);
  }

  return { "@context": context };
}

function buildNgsiLdExample(model: ModelDefinition): JsonObject {
  const example: JsonObject = {
    id: EXAMPLE_ID,
    type: model.type,
    "@context": [NGSI_LD_CORE_CONTEXT, model.contextUrl],
  };

  for (const [name, attribute] of sortedEntries(model.attributes)) {
    const property: JsonObject = {
      type: attribute.ngsiType,
      value: attribute.example,
    };

    if (attribute.unitCode !== undefined) {
      property.unitCode = attribute.unitCode;
    }

    example[name] = property;
  }

  return example;
}

function buildKeyValuesExample(model: ModelDefinition): JsonObject {
  const example: JsonObject = {
    id: EXAMPLE_ID,
    type: model.type,
  };

  for (const [name, attribute] of sortedEntries(model.attributes)) {
    example[name] = attribute.example;
  }

  return example;
}

function buildSchema(model: ModelDefinition): JsonObject {
  const required = [
    "id",
    "type",
    ...sortedEntries(model.attributes)
      .filter(([, attribute]) => attribute.required === true)
      .map(([name]) => name),
  ];

  const properties: JsonObject = {
    id: {
      type: "string",
      format: "uri",
    },
    type: {
      type: "string",
      const: model.type,
    },
  };

  for (const [name, attribute] of sortedEntries(model.attributes)) {
    properties[name] = {
      type: attribute.valueType,
      description: attribute.description ?? `Generated ${name} attribute.`,
    };
  }

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...(model.schemaId !== undefined ? { $id: model.schemaId } : {}),
    title: model.type,
    description: model.description ?? `${model.type} schema.`,
    type: "object",
    required,
    properties,
    additionalProperties: true,
  };
}

function matchesValueType(attribute: ModelAttributeDefinition): boolean {
  return typeof attribute.example === attribute.valueType;
}

function validateArtifacts(
  model: ModelDefinition,
  context: JsonObject,
  ngsiLdExample: JsonObject,
  keyValuesExample: JsonObject,
  schema: JsonObject,
): string[] {
  const errors: string[] = [];
  const attributeNames = Object.keys(model.attributes);
  const contextValues = context["@context"] as JsonObject;
  const schemaProperties = schema.properties as JsonObject;
  const schemaRequired = schema.required as string[];

  for (const [name, attribute] of sortedEntries(model.attributes)) {
    if (attribute.example === undefined) {
      errors.push(`${name} has no example.`);
    }
    if (attribute.valueType === undefined) {
      errors.push(`${name} has no valueType.`);
    }
    if (attribute.ngsiType === undefined) {
      errors.push(`${name} has no ngsiType.`);
    }
    if (!matchesValueType(attribute)) {
      errors.push(`${name} example type does not match valueType ${attribute.valueType}.`);
    }
    if (!(name in contextValues)) {
      errors.push(`context.jsonld does not contain ${name}.`);
    }
    if (!(name in ngsiLdExample)) {
      errors.push(`example.jsonld does not contain ${name}.`);
    }
    if (!(name in keyValuesExample)) {
      errors.push(`example-keyvalues.json does not contain ${name}.`);
    }
    if (!(name in schemaProperties)) {
      errors.push(`schema.json does not contain ${name}.`);
    }
    if (attribute.required === true && !schemaRequired.includes(name)) {
      errors.push(`${name} is required in model but missing from schema.required.`);
    }
  }

  for (const name of attributeNames) {
    const ngsiLdAttribute = ngsiLdExample[name] as JsonObject | undefined;
    if (ngsiLdAttribute?.type !== model.attributes[name]?.ngsiType) {
      errors.push(`${name} has mismatching NGSI-LD attribute type in example.jsonld.`);
    }
  }

  return errors.sort((left, right) => left.localeCompare(right));
}

async function writeJsonFile(path: string, value: JsonObject): Promise<void> {
  await writeFile(path, stableJson(value), "utf8");
}

export async function generateDetBuildingEnergyProfileArtifacts(
  options: DetBuildingEnergyProfileGeneratorOptions,
): Promise<string> {
  const cwd = options.cwd ?? process.cwd();
  const outputDir = resolve(cwd, options.config.outputDir ?? DEFAULT_OUTPUT_DIR);
  const model = withGeneratorConfig(options.config);
  const context = buildContext(model);
  const ngsiLdExample = buildNgsiLdExample(model);
  const keyValuesExample = buildKeyValuesExample(model);
  const schema = buildSchema(model);

  const validationErrors = validateArtifacts(model, context, ngsiLdExample, keyValuesExample, schema);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.map((error) => `ERROR: ${error}`).join("\n"));
  }

  await mkdir(outputDir, { recursive: true });
  await writeJsonFile(resolve(outputDir, "context.jsonld"), context);
  await writeJsonFile(resolve(outputDir, "example.jsonld"), ngsiLdExample);
  await writeJsonFile(resolve(outputDir, "example-keyvalues.json"), keyValuesExample);
  await writeJsonFile(resolve(outputDir, "schema.json"), schema);

  return outputDir;
}
