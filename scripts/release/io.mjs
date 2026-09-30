import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

export const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
export function command(name, args, options = {}) {
  const result = execFileSync(name, args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, ...options });
  return typeof result === 'string' ? result.trim() : result;
}
export function git(...args) { return command('git', args); }
export function api(endpoint, { method = 'GET', body } = {}) {
  return JSON.parse(command('gh', ['api', endpoint, '--method', method,
    ...(body ? ['--input', '-'] : [])], body ? { input: JSON.stringify(body) } : {}));
}
export function releases() {
  return JSON.parse(command('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/releases?per_page=100`,
    '--paginate', '--slurp'])).flat();
}
export function outputs(values) {
  for (const [key, value] of Object.entries(values)) {
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}
export function summary(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}
export function registryDigest(reference, { allowMissing = false } = {}) {
  try {
    const output = command('docker', ['buildx', 'imagetools', 'inspect', reference]);
    const match = output.match(/^Digest:\s+(sha256:[a-f0-9]{64})\s*$/m);
    if (!match) throw new Error(`No digest returned for ${reference}`);
    return match[1];
  } catch (error) {
    // Authentication/network errors must never be interpreted as an absent tag.
    if (allowMissing && /manifest unknown|MANIFEST_UNKNOWN|:\s*not found\s*$/i.test(String(error.stderr).trim())
      && !/unauthorized|denied|authentication/i.test(String(error.stderr))) return null;
    throw error;
  }
}
export function tree(commit) {
  return git('ls-tree', '-rz', '--full-tree', commit).split('\0').filter(Boolean).map((line) => {
    const [header, path] = line.split('\t');
    const [mode, type, oid] = header.split(' ');
    if (type !== 'blob') throw new Error(`Unsupported build input type: ${path}`);
    return { path, mode, oid };
  });
}
export function readManifest(commit) {
  const exists = git('ls-tree', commit, '--', 'release/manifest.json');
  return exists ? JSON.parse(git('show', `${commit}:release/manifest.json`)) : null;
}
