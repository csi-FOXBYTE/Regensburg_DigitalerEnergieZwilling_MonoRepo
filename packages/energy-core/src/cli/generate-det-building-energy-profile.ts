import { access } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  generateDetBuildingEnergyProfileArtifacts,
  type DetBuildingEnergyProfileGeneratorConfig,
} from "../model/det-building-energy-profile.generator.js";

const DEFAULT_CONFIG_FILES = [
  "det-building-energy-profile.config.ts",
  "det-building-energy-profile.config.mts",
  "det-building-energy-profile.config.cts",
  "det-building-energy-profile.config.js",
  "det-building-energy-profile.config.mjs",
  "det-building-energy-profile.config.cjs",
];

type CliArgs = {
  configPath?: string;
  help: boolean;
};

function parseArgs(args: string[]): CliArgs {
  const parsed: CliArgs = { help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--config" || arg === "-c") {
      const value = args[index + 1];
      if (value === undefined) {
        throw new Error("Missing value for --config.");
      }
      parsed.configPath = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--config=")) {
      parsed.configPath = arg.slice("--config=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveConfigPath(cwd: string, explicitConfigPath?: string): Promise<string> {
  if (explicitConfigPath !== undefined) {
    return resolve(cwd, explicitConfigPath);
  }

  for (const fileName of DEFAULT_CONFIG_FILES) {
    const candidate = resolve(cwd, fileName);
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No det-building-energy-profile config found in ${cwd}.`);
}

function isConfigObject(value: unknown): value is DetBuildingEnergyProfileGeneratorConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<DetBuildingEnergyProfileGeneratorConfig>;
  return typeof candidate.contextUrl === "string" && typeof candidate.namespace === "string";
}

async function loadConfig(configPath: string): Promise<DetBuildingEnergyProfileGeneratorConfig> {
  let module: { default?: unknown };

  try {
    module = (await import(pathToFileURL(configPath).href)) as { default?: unknown };
  } catch (error) {
    const extension = extname(configPath);
    if (extension === ".ts" || extension === ".mts" || extension === ".cts") {
      throw new Error(
        `Could not load TypeScript config ${configPath}. Run the generator through tsx or use a JavaScript config file.`,
        { cause: error },
      );
    }

    throw error;
  }

  const config = module.default;
  if (!isConfigObject(config)) {
    throw new Error("Config must default-export an object with contextUrl and namespace.");
  }

  return config;
}

function printHelp(): void {
  console.log(`Usage: generate-det-building-energy-profile [--config <path>]

By default, the generator looks for det-building-energy-profile.config.* in the current working directory.`);
}

export async function runGenerateDetBuildingEnergyProfileCli(args: string[], cwd: string): Promise<void> {
  try {
    const parsedArgs = parseArgs(args);
    if (parsedArgs.help) {
      printHelp();
      return;
    }

    const configPath = await resolveConfigPath(cwd, parsedArgs.configPath);
    const config = await loadConfig(configPath);
    const outputDir = await generateDetBuildingEnergyProfileArtifacts({ cwd, config });

    console.log(`Generated DETBuildingEnergyProfile artifacts in ${outputDir}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
