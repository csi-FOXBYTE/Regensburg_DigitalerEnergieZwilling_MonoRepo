import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Use the generator that @tanstack/router-plugin pins itself, so `pnpm generate`
// and `vite build` always produce the same route tree.
const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve('@tanstack/router-plugin/package.json'));
const generatorManifest = pluginRequire.resolve('@tanstack/router-generator/package.json');
const { exports } = JSON.parse(readFileSync(generatorManifest, 'utf8'));
const { Generator, getConfig } = await import(
  pathToFileURL(join(dirname(generatorManifest), exports['.'].import.default)).href
);

const root = process.cwd();
await new Generator({ root, config: getConfig({ target: 'react', routeToken: 'layout', indexToken: 'page' }, root) }).run();
