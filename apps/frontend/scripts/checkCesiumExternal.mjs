import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

// vite-plugin-cesium maps `import ... from "cesium"` to the global `Cesium`
// loaded from /cesium/Cesium.js. It relies on Vite 8 still honouring
// build.rollupOptions; if that ever stops, Cesium is bundled or imported
// as a bare module and the map breaks without the build failing.
const distRoot = resolve("dist");
const chunkRoot = resolve(distRoot, "_astro");

const bareImport = /\bfrom\s*["']cesium["']|\bimport\(\s*["']cesium["']\s*\)/;
// Every Cesium build contains its GLSL built-ins (czm_*); app code never does.
const inlinedCesium = /czm_[A-Za-z]/;

async function main() {
  const problems = [];
  let usesGlobal = false;

  for (const name of await readdir(chunkRoot)) {
    if (!name.endsWith(".js")) continue;
    const code = await readFile(resolve(chunkRoot, name), "utf8");
    if (bareImport.test(code)) problems.push(`${name} imports "cesium" as a module`);
    if (inlinedCesium.test(code)) problems.push(`${name} contains an inlined Cesium build`);
    if (/\bCesium\.[A-Z]/.test(code)) usesGlobal = true;
  }
  if (!usesGlobal) problems.push("no chunk uses the global Cesium object");

  const html = await readFile(resolve(distRoot, "de/index.html"), "utf8");
  if (!html.includes('src="/cesium/Cesium.js"'))
    problems.push("de/index.html does not load /cesium/Cesium.js");

  if (problems.length > 0) {
    console.error(`Cesium is not externalized:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Failed to check the Cesium externalization:", error);
  process.exit(1);
});
