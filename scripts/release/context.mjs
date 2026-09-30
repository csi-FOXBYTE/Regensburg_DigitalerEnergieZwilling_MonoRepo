import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { components, isBuildInput } from './core.mjs';
import { command, git, tree } from './io.mjs';

const [component, destination, mode] = process.argv.slice(2);
assert(components.includes(component), 'Expected frontend, adminfrontend or backend');
assert(destination && !existsSync(destination), 'Context destination must not exist');
const root = git('rev-parse', '--show-toplevel');
const target = path.resolve(destination);
assert(!target.startsWith(`${root}/`) || target.startsWith(`${root}/.local/`),
  'Use a temporary directory or .local for build contexts');
let files;
if (mode === '--worktree') {
  // Local validation only. CI always exports committed blobs from its pinned SHA.
  files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
    .filter((file) => isBuildInput(file, component));
  mkdirSync(target, { recursive: true });
  for (const file of files) {
    mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
    cpSync(path.join(root, file), path.join(target, file), { dereference: false });
  }
} else {
  assert.equal(mode, undefined, 'Unknown context option');
  const plan = JSON.parse(readFileSync(`${process.env.RELEASE_DIR}/plan.json`));
  assert.equal(git('rev-parse', 'HEAD'), plan.sourceCommit);
  files = tree(plan.sourceCommit).filter(({ path: file }) => isBuildInput(file, component)).map(({ path: file }) => file);
  const archive = command('git', ['archive', '--format=tar', plan.sourceCommit, '--', ...files], { encoding: 'buffer' });
  mkdirSync(target, { recursive: true });
  command('tar', ['-xf', '-', '-C', target], { input: archive });
}
console.log(`Prepared ${component} context with ${files.length} tracked build inputs.`);
