import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export const digest = value => `sha256:${createHash('sha256').update(value).digest('hex')}`;
export const json = file => JSON.parse(readFileSync(file, 'utf8'));
export const save = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.error?.message ?? result.stderr ?? ''}`);
  return Buffer.isBuffer(result.stdout) ? result.stdout : result.stdout?.trim();
}
