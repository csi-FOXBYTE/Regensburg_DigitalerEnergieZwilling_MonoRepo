import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

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

function runPnpm(args) {
  const pnpmCli = process.env.npm_execpath;
  return pnpmCli && /\.(c?js|mjs)$/.test(pnpmCli)
    ? run(process.execPath, [pnpmCli, ...args])
    : run("pnpm", args);
}

function splitNpmName(name) {
  if (!name.startsWith("@")) return { name };
  const separator = name.indexOf("/");
  return { group: name.slice(0, separator), name: name.slice(separator + 1) };
}

function npmPurl(name, version) {
  const scoped = splitNpmName(name);
  const encodedName = scoped.group
    ? encodeURIComponent(scoped.group) + "/" + encodeURIComponent(scoped.name)
    : encodeURIComponent(scoped.name);
  return "pkg:npm/" + encodedName + "@" + encodeURIComponent(version);
}

function repositoryUrl(packageJson) {
  const repository = packageJson.repository;
  return typeof repository === "string" ? repository : repository?.url;
}

function repositoryName(packageJson) {
  const url = repositoryUrl(packageJson)?.replace(/\.git$/, "");
  return url ? basename(url) : basename(process.cwd());
}

function authorList(author) {
  if (typeof author === "string") {
    const name = author.split(/[<(]/, 1)[0].trim();
    return name ? [{ name }] : [];
  }
  if (author && typeof author === "object" && author.name) {
    return [
      {
        name: author.name,
        ...(author.email ? { email: author.email } : {}),
      },
    ];
  }
  return [];
}

function licenseEntry(license) {
  if (typeof license !== "string" || license.trim() === "") {
    return { license: { name: "NOASSERTION" } };
  }
  return { license: { id: license } };
}

async function detectedCopyright(path) {
  try {
    const text = await readFile(path, "utf8");
    return text.match(/^Copyright[^\r\n]*/im)?.[0];
  } catch {
    return undefined;
  }
}

function externalReferences(metadata, resolved) {
  const references = [];
  if (resolved) references.push({ type: "distribution", url: resolved });
  if (metadata.homepage) {
    references.push({ type: "website", url: metadata.homepage });
  }
  const vcs = repositoryUrl(metadata);
  if (vcs) references.push({ type: "vcs", url: vcs });
  const issueTracker =
    typeof metadata.bugs === "string" ? metadata.bugs : metadata.bugs?.url;
  if (issueTracker) {
    references.push({ type: "issue-tracker", url: issueTracker });
  }
  return references;
}

function dependencyEntries(node) {
  return Object.entries({
    ...(node.dependencies ?? {}),
    ...(node.optionalDependencies ?? {}),
  });
}

function setProperties(component, entries) {
  component.properties = entries.map(([name, value]) => ({ name, value }));
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}

function property(component, name) {
  return component.properties?.find((entry) => entry.name === name)?.value;
}

function licenseValue(component) {
  const licenses = (component.licenses ?? []).map(
    ({ license, expression }) =>
      expression ?? license?.id ?? license?.name ?? "NOASSERTION",
  );
  return licenses.length > 0 ? licenses.join(" AND ") : "NOASSERTION";
}

function componentName(component) {
  return component.group
    ? component.group + "/" + component.name
    : component.name;
}

function createCsv(repository, root, components) {
  const header = [
    "Repository",
    "Component Type",
    "Ecosystem",
    "Name",
    "Version",
    "Dependency Scope",
    "Relationship",
    "License",
    "Copyright",
    "PURL or Reference",
    "Metadata Source",
    "Notes",
  ].join(",");
  const rows = [root, ...components].map((component) => {
    const relationship = property(component, "sbom:relationship") ?? "";
    return [
      repository,
      component.type,
      property(component, "sbom:ecosystem") ?? "",
      componentName(component),
      component.version,
      "runtime",
      relationship,
      licenseValue(component),
      component.copyright,
      component.purl ?? component["bom-ref"],
      property(component, "sbom:metadata-source") ?? "",
      property(component, "sbom:notes") ?? "",
    ]
      .map(csvValue)
      .join(",");
  });
  return [header, ...rows].join("\n") + "\n";
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const repository = repositoryName(packageJson);
const listed = JSON.parse(
  runPnpm(["--filter", packageJson.name, "list", "--json", "--depth", "Infinity"]),
)[0];
const rootDependencies = {
  ...(listed.dependencies ?? {}),
  ...(listed.optionalDependencies ?? {}),
  ...(listed.devDependencies ?? {}),
};
const peerNames = Object.keys(packageJson.peerDependencies ?? {});
const missingPeers = peerNames.filter((name) => rootDependencies[name] == null);
if (missingPeers.length > 0) {
  throw new Error(
    "Installed dependency graph omits peer dependencies: " +
      missingPeers.join(", "),
  );
}

const directRefs = new Set();
const components = new Map();
const dependencyMap = new Map();
const expandedNodes = new Set();

async function visit(name, node, direct = false) {
  const actualName = node.from ?? name;
  const ref = npmPurl(actualName, node.version);
  if (direct) directRefs.add(ref);

  if (!components.has(ref)) {
    const metadata = JSON.parse(
      await readFile(resolve(node.path, "package.json"), "utf8"),
    );
    const copyright = await detectedCopyright(resolve(node.path, "LICENSE"));
    const references = externalReferences(metadata, node.resolved);
    const scoped = splitNpmName(actualName);
    const component = {
      type: "library",
      ...(scoped.group ? { group: scoped.group } : {}),
      name: scoped.name,
      version: node.version,
      scope: "required",
      "bom-ref": ref,
      purl: ref,
      ...(metadata.description ? { description: metadata.description } : {}),
      ...(authorList(metadata.author).length > 0
        ? { authors: authorList(metadata.author) }
        : {}),
      licenses: [licenseEntry(metadata.license)],
      ...(copyright ? { copyright } : {}),
      ...(references.length > 0 ? { externalReferences: references } : {}),
    };
    setProperties(component, [
      ["sbom:repository", repository],
      ["sbom:ecosystem", "npm"],
      [
        "sbom:relationship",
        direct
          ? "direct runtime peer dependency"
          : "transitive runtime dependency",
      ],
      [
        "sbom:metadata-source",
        "pnpm-lock.yaml (workspace root) and installed package metadata",
      ],
      [
        "sbom:notes",
        "Generated from the resolved peer-dependency graph and local package metadata.",
      ],
    ]);
    components.set(ref, component);
  }

  const childEntries = dependencyEntries(node);
  dependencyMap.set(
    ref,
    childEntries
      .map(([childName, child]) =>
        npmPurl(child.from ?? childName, child.version),
      )
      .sort(),
  );
  const identity = node.path ?? ref;
  if (expandedNodes.has(identity)) return ref;
  expandedNodes.add(identity);
  for (const [childName, child] of childEntries) {
    await visit(childName, child);
  }
  return ref;
}

for (const name of peerNames) {
  await visit(name, rootDependencies[name], true);
}

const rootRef = npmPurl(packageJson.name, packageJson.version);
const scopedRoot = splitNpmName(packageJson.name);
const rootCopyright = await detectedCopyright("NOTICE");
const root = {
  type: "library",
  ...(scopedRoot.group ? { group: scopedRoot.group } : {}),
  name: scopedRoot.name,
  version: packageJson.version,
  "bom-ref": rootRef,
  purl: rootRef,
  description: packageJson.description,
  licenses: [licenseEntry(packageJson.license)],
  ...(rootCopyright ? { copyright: rootCopyright } : {}),
  ...(repositoryUrl(packageJson)
    ? { externalReferences: [{ type: "vcs", url: repositoryUrl(packageJson) }] }
    : {}),
};

let sourceState = "Git state unavailable";
let commit;
try {
  commit = run("git", ["rev-parse", "HEAD"]).trim();
  sourceState =
    run("git", ["status", "--porcelain"]).trim() === ""
      ? "clean"
      : "modified working tree";
} catch {
  // Git metadata is useful but not required when generating from a source archive.
}
setProperties(root, [
  ["sbom:repository", repository],
  ["sbom:ecosystem", "first-party"],
  ["sbom:relationship", "root component"],
  ["sbom:metadata-source", repository + "/package.json and NOTICE"],
  ["sbom:notes", "Published first-party npm library."],
  ...(commit ? [["vcs:commit", commit]] : []),
  ["sbom:source-state", sourceState],
]);

const sortedComponents = [...components.values()].sort((left, right) =>
  left["bom-ref"].localeCompare(right["bom-ref"]),
);
const bom = {
  $schema: "http://cyclonedx.org/schema/bom-1.6.schema.json",
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  serialNumber: "urn:uuid:" + randomUUID(),
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    lifecycles: [{ phase: "build" }],
    tools: {
      components: [
        {
          type: "application",
          name: "pnpm",
          version: runPnpm(["--version"]).trim(),
        },
        {
          type: "application",
          name: "repository SBOM scoping script",
          version: "1",
        },
      ],
    },
    component: root,
    properties: [
      {
        name: "sbom:scope",
        value:
          "The published first-party library and its resolved runtime peer-dependency closure",
      },
      {
        name: "sbom:excluded-scope",
        value:
          "Build, test, lint, formatting, documentation, editor, and local-development-only dependencies",
      },
    ],
  },
  components: sortedComponents,
  dependencies: [
    { ref: rootRef, dependsOn: [...directRefs].sort() },
    ...sortedComponents.map((component) => ({
      ref: component["bom-ref"],
      dependsOn: dependencyMap.get(component["bom-ref"]) ?? [],
    })),
  ],
};

await writeFile(jsonTemporaryPath, JSON.stringify(bom, null, 2) + "\n");
await writeFile(
  csvTemporaryPath,
  createCsv(repository, root, sortedComponents),
);
await rename(jsonTemporaryPath, jsonOutputPath);
await rename(csvTemporaryPath, csvOutputPath);
console.log(
  "Generated " +
    basename(jsonOutputPath) +
    " and " +
    basename(csvOutputPath) +
    " with " +
    sortedComponents.length +
    " dependency component(s).",
);
