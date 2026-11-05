import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSubsidies } from '../src/lib/state/calculation-config';

const first = { subsidy: { title: 'BEG Einzelmaßnahmen' }, isActive: true };
const second = { subsidy: { title: 'KfW 261' }, isActive: false };

test('reads one string holding the whole array (backend default)', () => {
  assert.deepEqual(parseSubsidies([JSON.stringify([first, second])]), [
    first,
    second,
  ]);
});

test('reads one JSON string per entry (configs saved by older admin versions)', () => {
  assert.deepEqual(
    parseSubsidies([JSON.stringify(first), JSON.stringify(second)]),
    [first, second],
  );
});

test('reads a single entry saved as its own string', () => {
  assert.deepEqual(parseSubsidies([JSON.stringify(first)]), [first]);
});

test('returns no subsidies for empty or unusable values', () => {
  assert.deepEqual(parseSubsidies([]), []);
  assert.deepEqual(parseSubsidies(undefined), []);
  assert.deepEqual(parseSubsidies(['null']), []);
});
