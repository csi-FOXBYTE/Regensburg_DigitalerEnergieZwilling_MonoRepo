import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const repository = JSON.parse(readFileSync("package.json", "utf8")).name;
const configPath = resolve("sbom.config.json");
const jsonOutputPath = resolve("SBOM.cdx.json");
const csvOutputPath = resolve("SBOM.csv");
const jsonTemporaryPath = jsonOutputPath + ".tmp";
const csvTemporaryPath = csvOutputPath + ".tmp";

function run(command, args) {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function generateDependencyBom() {
  const args = [
    "--filter", repository, "sbom",
    "--sbom-format",
    "cyclonedx",
    "--sbom-spec-version",
    "1.6",
    "--sbom-type",
    "application",
  ];
  const pnpmCli = process.env.npm_execpath;
  return pnpmCli && /\.(c?js|mjs)$/.test(pnpmCli)
    ? run(process.execPath, [pnpmCli, ...args])
    : run("pnpm", args);
}

function npmName(component) {
  return component.group ? component.group + "/" + component.name : component.name;
}

function getProperty(component, name) {
  return component.properties?.find((entry) => entry.name === name)?.value;
}

function setProperty(component, name, value) {
  const properties = component.properties ?? [];
  const existing = properties.find((entry) => entry.name === name);
  if (existing) existing.value = value;
  else properties.push({ name, value });
  component.properties = properties;
}

function dependencyClosure(startRefs, dependencyMap) {
  const visited = new Set();
  const pending = [...startRefs];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current == null || visited.has(current)) continue;
    visited.add(current);
    pending.push(...(dependencyMap.get(current) ?? []));
  }
  return visited;
}

function requiredString(value, location) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(location + " must be a non-empty string");
  }
  return value;
}

function applyReleaseVersion(bom) {
  const requestedVersion = process.env.SBOM_VERSION?.trim();
  if (!requestedVersion) return;
  const version = requestedVersion.replace(/^v/, "");
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error("SBOM_VERSION must be a semantic version");
  }

  const root = bom.metadata.component;
  const oldRef = root["bom-ref"];
  const purl = requiredString(root.purl, "metadata.component.purl");
  const newRef = purl.slice(0, purl.lastIndexOf("@") + 1) +
    encodeURIComponent(version);
  root.version = version;
  root.purl = newRef;
  root["bom-ref"] = newRef;
  for (const dependency of bom.dependencies) {
    if (dependency.ref === oldRef) dependency.ref = newRef;
  }
}

function addRepositoryMetadata(bom, packageJson, config) {
  const root = bom.metadata.component;
  const rootRef = root["bom-ref"];
  const dependencyMap = new Map(
    bom.dependencies.map((entry) => [entry.ref, entry.dependsOn ?? []]),
  );
  const componentsByRef = new Map(
    bom.components.map((component) => [component["bom-ref"], component]),
  );
  const rootDependencyRefs =
    bom.dependencies.find((entry) => entry.ref === rootRef)?.dependsOn ?? [];
  const directRefsByName = new Map(
    rootDependencyRefs.map((ref) => [npmName(componentsByRef.get(ref)), ref]),
  );

  const runtimeDirectNames = new Set(Object.keys(packageJson.dependencies ?? {}));
  const buildDirectNames = new Set(config.buildDependencies ?? []);
  for (const name of buildDirectNames) {
    if (
      packageJson.devDependencies?.[name] == null &&
      packageJson.dependencies?.[name] == null
    ) {
      throw new Error("Configured build dependency is not declared: " + name);
    }
  }

  const relevantDirectNames = new Set([
    ...runtimeDirectNames,
    ...buildDirectNames,
  ]);
  const missingDirectNames = [...relevantDirectNames].filter(
    (name) => !directRefsByName.has(name),
  );
  if (missingDirectNames.length > 0) {
    throw new Error(
      "pnpm SBOM omits configured direct dependencies: " +
        missingDirectNames.join(", "),
    );
  }

  const runtimeDirectRefs = new Set(
    [...runtimeDirectNames].map((name) => directRefsByName.get(name)),
  );
  const buildDirectRefs = new Set(
    [...buildDirectNames].map((name) => directRefsByName.get(name)),
  );
  const runtimeRefs = dependencyClosure(runtimeDirectRefs, dependencyMap);
  const buildRefs = dependencyClosure(buildDirectRefs, dependencyMap);
  const includedRefs = new Set([...runtimeRefs, ...buildRefs]);

  bom.components = bom.components.filter((component) =>
    includedRefs.has(component["bom-ref"]),
  );
  bom.dependencies = bom.dependencies
    .filter((entry) => entry.ref === rootRef || includedRefs.has(entry.ref))
    .map((entry) => ({
      ...entry,
      dependsOn: (entry.dependsOn ?? []).filter((ref) => includedRefs.has(ref)),
    }));

  requiredString(config.description, "sbom.config.json description");
  root.description = config.description;
  setProperty(root, "sbom:repository", repository);
  setProperty(root, "sbom:ecosystem", "first-party");
  setProperty(root, "sbom:relationship", "root component");
  setProperty(root, "sbom:metadata-source", repository + "/package.json");
  setProperty(root, "sbom:notes", "First-party repository component.");

  try {
    setProperty(root, "vcs:commit", run("git", ["rev-parse", "HEAD"]).trim());
    const status = run("git", ["status", "--porcelain"]).trim();
    setProperty(
      root,
      "sbom:source-state",
      status === "" ? "clean" : "modified working tree",
    );
  } catch {
    setProperty(root, "sbom:source-state", "Git state unavailable");
  }

  for (const component of bom.components) {
    const ref = component["bom-ref"];
    let relationship;
    if (runtimeDirectRefs.has(ref)) relationship = "direct runtime dependency";
    else if (buildDirectRefs.has(ref)) relationship = "direct build dependency";
    else if (runtimeRefs.has(ref)) relationship = "transitive runtime dependency";
    else relationship = "transitive build dependency";

    setProperty(component, "sbom:repository", repository);
    setProperty(component, "sbom:ecosystem", "npm");
    setProperty(component, "sbom:relationship", relationship);
    setProperty(
      component,
      "sbom:metadata-source",
      "pnpm-lock.yaml (workspace root) and installed package metadata",
    );
    setProperty(
      component,
      "sbom:notes",
      "Generated from pnpm's resolved dependency graph and local package metadata.",
    );
  }
}

function addConfiguredComponents(bom, config) {
  if (!Array.isArray(config.additionalComponents)) {
    throw new Error("sbom.config.json must contain an additionalComponents array");
  }
  const rootRef = bom.metadata.component["bom-ref"];
  const components = config.additionalComponents.map((configured, index) => {
    const location = "additionalComponents[" + index + "]";
    if (configured == null || typeof configured !== "object") {
      throw new Error(location + " must be an object");
    }
    const {
      ecosystem,
      relationship,
      metadataSource,
      notes,
      ...component
    } = configured;
    for (const field of ["type", "bom-ref", "name", "version"]) {
      requiredString(component[field], location + "." + field);
    }
    requiredString(ecosystem, location + ".ecosystem");
    requiredString(relationship, location + ".relationship");
    requiredString(metadataSource, location + ".metadataSource");
    requiredString(notes, location + ".notes");
    setProperty(component, "sbom:repository", repository);
    setProperty(component, "sbom:ecosystem", ecosystem);
    setProperty(component, "sbom:relationship", relationship);
    setProperty(
      component,
      "sbom:metadata-source",
      repository + "/" + metadataSource,
    );
    setProperty(component, "sbom:notes", notes);
    return component;
  });

  bom.components.push(...components);
  let rootDependencies = bom.dependencies.find((entry) => entry.ref === rootRef);
  if (!rootDependencies) {
    rootDependencies = { ref: rootRef, dependsOn: [] };
    bom.dependencies.unshift(rootDependencies);
  }
  rootDependencies.dependsOn = [
    ...new Set([
      ...(rootDependencies.dependsOn ?? []),
      ...components.map((component) => component["bom-ref"]),
    ]),
  ].sort();
  bom.dependencies.push(
    ...components.map((component) => ({
      ref: component["bom-ref"],
      dependsOn: [],
    })),
  );
}

function addGenerationMetadata(bom) {
  bom.metadata.tools ??= { components: [] };
  bom.metadata.tools.components ??= [];
  bom.metadata.tools.components.push({
    type: "application",
    name: "repository SBOM scoping script",
    version: "1",
  });
  bom.metadata.properties = [
    {
      name: "sbom:scope",
      value:
        "The first-party application, runtime dependencies, dependencies required to build its deployable artifact, and explicitly referenced container/system software",
    },
    {
      name: "sbom:excluded-scope",
      value:
        "Test, lint, formatting, editor, scaffolding, and local-development-only dependencies are excluded unless also reachable from a runtime or configured build dependency",
    },
    {
      name: "sbom:container-detail",
      value:
        "Container components are inventory references; packages inside base images are not expanded",
    },
    {
      name: "sbom:unresolved-policy",
      value:
        "Unpinned versions and NOASSERTION licenses are retained for manual review; no missing metadata is guessed",
    },
  ];
}

function validateBom(bom) {
  if (bom.bomFormat !== "CycloneDX" || bom.specVersion !== "1.6") {
    throw new Error("pnpm did not generate CycloneDX 1.6");
  }
  const components = [bom.metadata.component, ...bom.components];
  const refs = components.map((component) => component["bom-ref"]);
  if (refs.some((ref) => typeof ref !== "string" || ref === "")) {
    throw new Error("SBOM contains a component without a bom-ref");
  }
  if (new Set(refs).size !== refs.length) {
    throw new Error("SBOM contains duplicate component bom-ref values");
  }
  const knownRefs = new Set(refs);
  const danglingRefs = [
    ...new Set(
      bom.dependencies.flatMap((entry) => [
        entry.ref,
        ...(entry.dependsOn ?? []),
      ]).filter((ref) => !knownRefs.has(ref)),
    ),
  ];
  if (danglingRefs.length > 0) {
    throw new Error(
      "SBOM contains dangling dependency references: " +
        danglingRefs.join(", "),
    );
  }
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text)
    ? '"' + text.replaceAll('"', '""') + '"'
    : text;
}

function licenseValue(component) {
  const licenses = (component.licenses ?? []).map(
    ({ license, expression }) =>
      expression ?? license?.id ?? license?.name ?? "NOASSERTION",
  );
  return licenses.length > 0 ? licenses.join(" AND ") : "NOASSERTION";
}

function csvRow(component) {
  const relationship = getProperty(component, "sbom:relationship") ?? "";
  const scope = relationship.includes("build") ? "build" : "runtime";
  return [
    repository,
    component.type,
    getProperty(component, "sbom:ecosystem") ?? "",
    component.type === "library" && component.group
      ? npmName(component)
      : component.name,
    component.version,
    scope,
    relationship,
    licenseValue(component),
    component.purl ?? component["bom-ref"],
    getProperty(component, "sbom:metadata-source") ?? "",
    getProperty(component, "sbom:notes") ?? "",
  ].map(csvValue).join(",");
}

function createCsv(bom) {
  const header = [
    "Repository",
    "Component Type",
    "Ecosystem",
    "Name",
    "Version",
    "Dependency Scope",
    "Relationship",
    "License",
    "PURL or Reference",
    "Metadata Source",
    "Notes",
  ].join(",");
  const components = [bom.metadata.component, ...bom.components].sort(
    (left, right) => {
      const rank = (component) => {
        if (component === bom.metadata.component) return 0;
        if (component.type === "container") return 1;
        if (getProperty(component, "sbom:ecosystem") !== "npm") return 2;
        return 3;
      };
      return rank(left) - rank(right) ||
        npmName(left).localeCompare(npmName(right));
    },
  );
  return [header, ...components.map(csvRow)].join("\n") + "\n";
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const config = JSON.parse(await readFile(configPath, "utf8"));
if (!Array.isArray(config.buildDependencies)) {
  throw new Error("sbom.config.json must contain a buildDependencies array");
}
const bom = JSON.parse(generateDependencyBom());
applyReleaseVersion(bom);
addRepositoryMetadata(bom, packageJson, config);
addConfiguredComponents(bom, config);
addGenerationMetadata(bom);
validateBom(bom);

await writeFile(jsonTemporaryPath, JSON.stringify(bom, null, 2) + "\n");
await writeFile(csvTemporaryPath, createCsv(bom));
await rename(jsonTemporaryPath, jsonOutputPath);
await rename(csvTemporaryPath, csvOutputPath);
console.log(
  "Generated " + basename(jsonOutputPath) + " and " +
    basename(csvOutputPath) + " with " + bom.components.length + " components.",
);
