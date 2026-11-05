// Installs Prisma's schema and query engines into the backend deploy output at
// build time, so the add-on's `zenstack migrate deploy` never downloads an
// executable at runtime, whether or not the root filesystem is writable. pnpm
// does not run the @prisma/engines postinstall (allowBuilds in
// pnpm-workspace.yaml). Prisma's fetch-engine checks the checksums published
// next to the engines; the digests pinned here also check them against this repo.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// The runtime image is Debian bookworm with OpenSSL 3.
const binaryTarget = "debian-openssl-3.0.x";
// sha256 of each unpacked engine for that target, per Prisma engines commit
// (@prisma/engines-version). A Prisma update fails the build until its digests
// are added here.
const pinnedDigests = {
  c2990dca591cba766e3b7ef5d9e8a84796e47ab7: {
    "schema-engine": "5d42b181631fd20bb0ecc5abcdba72575e7f467a0d52f4d5ef1ff28f0c74e6e9",
    "libquery-engine": "a2924eab1c78a0a7bb67edac5738939fa10589ef073af5542f53812a22e4a7d8",
  },
};

const [deployDirectory] = process.argv.slice(2);
if (!deployDirectory) throw new Error("Usage: install-prisma-engines.mjs <deploy directory>");

// Resolve @prisma/engines the way zenstack's prisma does inside the deploy output.
const cli = createRequire(realpathSync(join(deployDirectory, "node_modules/@zenstackhq/cli/package.json")));
const enginesEntry = createRequire(cli.resolve("prisma/build/index.js")).resolve("@prisma/engines");
const requireEngines = createRequire(enginesEntry);
const { enginesVersion, getEnginesPath } = requireEngines(enginesEntry);
const expected = pinnedDigests[enginesVersion];
if (!expected) throw new Error(`No engine digests pinned for Prisma engines ${enginesVersion}`);

const { download } = requireEngines("@prisma/fetch-engine");
const paths = await download({
  binaries: Object.fromEntries(Object.keys(expected).map((engine) => [engine, getEnginesPath()])),
  binaryTargets: [binaryTarget],
  version: enginesVersion,
  showProgress: false,
  failSilent: false,
});
for (const [engine, digest] of Object.entries(expected)) {
  const file = paths[engine][binaryTarget];
  const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
  if (actual !== digest) {
    rmSync(file, { force: true });
    throw new Error(`${engine} ${enginesVersion} has sha256 ${actual}, expected ${digest}`);
  }
  console.log(`Installed ${file} (sha256 ${actual})`);
}
