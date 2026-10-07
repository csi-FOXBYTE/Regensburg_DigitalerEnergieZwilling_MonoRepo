import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { declaredLicense, digest, fileEvidence, json, npmName, run, save, scan } from './common.mjs';

const component = process.argv[2];
assert(['frontend', 'adminfrontend', 'backend', 'energy-core'].includes(component));
const packageDir = component === 'energy-core' ? 'packages/energy-core' : `apps/${component}`;
const inventoryFile = path.resolve(process.argv[3] || `${packageDir}/SBOM.cdx.json`);
const bom = json(inventoryFile);
const destination = path.resolve(process.argv[4] || path.join('.local', 'compliance-build', component));
mkdirSync(destination, { recursive: true });
const input = path.join(destination, 'input');
assert(!existsSync(input), 'Compliance input directory already exists; use a fresh build');
mkdirSync(input);
const listed = JSON.parse(run('pnpm', ['--filter', `./${packageDir}`, 'list', '--json', '--depth', 'Infinity']));
const installed = new Map();
const seen = new Set();
function visit(node) {
  if (!node?.path) return;
  const manifestFile = path.join(node.path, 'package.json');
  if (!seen.has(node.path) && existsSync(manifestFile)) {
    seen.add(node.path);
    const metadata = json(manifestFile);
    installed.set(`${metadata.name}@${metadata.version}`, node.path);
  }
  // pnpm repeats nodes, sometimes with truncated children. A later occurrence
  // can expose dependencies that the earlier one omitted.
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const dependency of Object.values(node[group] ?? {})) visit(dependency);
  }
}
listed.forEach(visit);
const excluded = new Set(['node_modules', '.git', '.local', '.pnpm-store', '.tanstack', '.astro', '.build', '.dev', 'dist', 'coverage']);
function copyPackage(from, to, firstParty, bundledTool = false) {
  from = realpathSync(from);
  cpSync(from, to, { recursive: true, dereference: false, filter: source => {
    const parts = path.relative(from, source).split(path.sep);
    if (parts.some(part => (excluded.has(part) && !(bundledTool && part === 'node_modules')) || part.startsWith('.env'))) return false;
    if (firstParty && parts.some(part => ['test', 'tests'].includes(part))) return false;
    return !/^SBOM\.(cdx\.json|csv)$/.test(path.basename(source)) && !source.endsWith('.tsbuildinfo');
  } });
}
const inventory = [bom.metadata.component, ...(bom.components ?? [])].map(c => {
  const own = c === bom.metadata.component;
  const key = own ? `application:${component}` : c.purl || c['bom-ref'];
  const prefix = digest(key).slice(7, 31);
  const firstParty = c === bom.metadata.component || npmName(c) === '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
  let from = c === bom.metadata.component ? path.resolve(packageDir) : installed.get(`${npmName(c)}@${c.version}`);
  const toolchain = c.properties?.some(p => p.name === 'sbom:relationship' && p.value.startsWith('referenced build'));
  const debian = c.properties?.some(p => p.name === 'sbom:ecosystem' && p.value === 'Debian package');
  let version = own ? json(`${packageDir}/package.json`).version : c.version;
  let runtimeReference;
  if (toolchain && c.name === 'node') {
    assert(c.version.startsWith(process.versions.node), 'Node build-tool version mismatch');
    from = path.join(path.dirname(path.dirname(process.execPath)), 'LICENSE');
    assert(existsSync(from), 'Node distribution license is missing');
    mkdirSync(path.join(input, prefix));
    cpSync(from, path.join(input, prefix, 'LICENSE'));
  } else {
    if (toolchain && c.name === 'pnpm') {
      assert.equal(run('pnpm', ['--version']), c.version, 'pnpm build-tool version mismatch');
      const executable = realpathSync(run('which', ['pnpm']));
      from = path.dirname(path.dirname(executable));
      assert.equal(json(path.join(from, 'package.json')).name, 'pnpm');
    }
    if (toolchain && c.name === 'nginx') runtimeReference = { name: 'nginx', version: c.version.split('-')[0] };
    if (toolchain && debian) {
      version = run('dpkg-query', ['--show', '--showformat=${Version}', c.name]);
      if (['ca-certificates', 'openssl'].includes(c.name)) runtimeReference = { name: c.name };
      else {
        from = realpathSync(`/usr/share/doc/${c.name}`);
        assert(existsSync(path.join(from, 'copyright')), `Missing Debian copyright evidence: ${c.name}`);
      }
    }
    if (from) copyPackage(from, path.join(input, prefix), firstParty, toolchain);
  }
  return { key, prefix, name: npmName(c), version, purl: c.purl, firstParty,
    declaredLicense: declaredLicense(c),
    scope: c.properties?.find(p => p.name === 'sbom:relationship')?.value || 'application',
    ...(runtimeReference ? { runtimeReference } : from ? {} : { unavailable: 'No installed source corresponding to this component' }),
  };
});
const output = path.join(destination, 'scan.json');
const { report, errors } = scan(input, output);
const files = fileEvidence(report, input);
const evidence = {
  schema: 1, component, sourceCommit: process.env.SOURCE_COMMIT || 'local', build: process.env.BUILD_ID || 'local',
  scanner: 'scancode-toolkit-32.5.0', inventoryHash: digest(readFileSync(inventoryFile)),
  errors,
  components: inventory.map(({ prefix, ...c }) => ({ ...c, files: files.filter(f => f.path.startsWith(`${prefix}/`)) })),
};
save(path.join(destination, 'compliance-build.json'), evidence);
const notices = inventory.map(c => {
  const selected = files.filter(f => f.path.startsWith(`${c.prefix}/`));
  const texts = [...new Set(selected.flatMap(f => f.texts))].sort();
  return `${c.name} ${c.version || ''}\nDeclared license: ${c.declaredLicense}\n` +
    [...new Set(selected.flatMap(f => f.copyrights))].sort().join('\n') + '\n\n' + texts.join('\n\n');
}).join('\n\n========================================\n\n');
writeFileSync(path.join(destination, 'THIRD_PARTY_NOTICES.txt'), `${notices}\n`);
// The image keeps compact licensing evidence and notices, rather than duplicate
// dependency source trees. Final-container inventory is generated separately.
rmSync(input, { recursive: true, force: true });
rmSync(output);
console.log(`Collected fresh ScanCode evidence for ${component}: ${inventory.length} components, ${errors.length} scan errors`);
