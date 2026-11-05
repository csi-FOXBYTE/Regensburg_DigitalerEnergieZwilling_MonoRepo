// Installs Prisma's schema engine into the backend deploy output at build time,
// so the add-on's `zenstack migrate deploy` never downloads an executable at
// runtime. pnpm does not run the @prisma/engines postinstall (allowBuilds in
// pnpm-workspace.yaml). Prisma's fetch-engine checks the checksums published
// next to the engine; the digest pinned here also checks it against this repo.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// The runtime image is Debian bookworm with OpenSSL 3.
const binaryTarget = "debian-openssl-3.0.x";
// sha256 of the unpacked schema engine for that target, per Prisma engines
// commit (@prisma/engines-version). A Prisma update fails the build until its
// digest is added here.
const pinnedDigests = {
  c2990dca591cba766e3b7ef5d9e8a84796e47ab7:
    "5d42b181631fd20bb0ecc5abcdba72575e7f467a0d52f4d5ef1ff28f0c74e6e9",
};

const [deployDirectory] = process.argv.slice(2);
if (!deployDirectory) throw new Error("Usage: install-schema-engine.mjs <deploy directory>");

// Resolve @prisma/engines the way zenstack's prisma does inside the deploy output.
const cli = createRequire(realpathSync(join(deployDirectory, "node_modules/@zenstackhq/cli/package.json")));
const enginesEntry = createRequire(cli.resolve("prisma/build/index.js")).resolve("@prisma/engines");
const requireEngines = createRequire(enginesEntry);
const { enginesVersion, getEnginesPath } = requireEngines(enginesEntry);
const expected = pinnedDigests[enginesVersion];
if (!expected) throw new Error(`No schema engine digest pinned for Prisma engines ${enginesVersion}`);

const { download } = requireEngines("@prisma/fetch-engine");
const paths = await download({
  binaries: { "schema-engine": getEnginesPath() },
  binaryTargets: [binaryTarget],
  version: enginesVersion,
  showProgress: false,
  failSilent: false,
});
const engine = paths["schema-engine"][binaryTarget];
const actual = createHash("sha256").update(readFileSync(engine)).digest("hex");
if (actual !== expected) {
  rmSync(engine, { force: true });
  throw new Error(`Schema engine ${enginesVersion} has sha256 ${actual}, expected ${expected}`);
}
console.log(`Installed ${engine} (sha256 ${actual})`);
