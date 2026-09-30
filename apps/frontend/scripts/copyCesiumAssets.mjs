import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const sourceRoot = resolve("node_modules/cesium/Build/Cesium");
const targetRoot = resolve("public/cesium");

const entries = ["Assets", "ThirdParty", "Workers", "Widgets", "Cesium.js"];

async function main() {
  await rm(targetRoot, { recursive: true, force: true });
  await mkdir(targetRoot, { recursive: true });

  await Promise.all(
    entries.map((entry) =>
      cp(resolve(sourceRoot, entry), resolve(targetRoot, entry), {
        recursive: true,
      }),
    ),
  );
}

main().catch((error) => {
  console.error("Failed to copy Cesium assets:", error);
  process.exit(1);
});
