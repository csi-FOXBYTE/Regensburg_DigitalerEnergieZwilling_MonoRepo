import assert from 'node:assert/strict';
import test from 'node:test';
import {
  capabilityLink,
  readCapabilityLink,
} from '../src/lib/capability-link';

const read = (
  page: 'delete' | 'download',
  pathname: string,
  hash = '',
) => {
  const replaced: string[] = [];
  const result = readCapabilityLink(
    page,
    { pathname, hash },
    { replaceState: (_data, _unused, url) => replaced.push(String(url)) },
  );
  return { ...result, replaced };
};

test('capability links carry the token only in the fragment', () => {
  const link = capabilityLink(
    'https://det.example',
    'de',
    'delete',
    'token/with space',
  );
  assert.equal(link, 'https://det.example/de/delete#token%2Fwith%20space');
  const url = new URL(link);
  assert.equal(url.pathname, '/de/delete');
  assert.equal(url.search, '');
  assert.equal(
    capabilityLink('https://det.example', 'en', 'download', 'abc'),
    'https://det.example/en/download#abc',
  );
});

test('reads the token from the fragment without touching the history', () => {
  assert.deepEqual(read('delete', '/de/delete', '#token%2Fwith%20space'), {
    locale: 'de',
    token: 'token/with space',
    replaced: [],
  });
  assert.deepEqual(read('download', '/en/download/', '#abc'), {
    locale: 'en',
    token: 'abc',
    replaced: [],
  });
  assert.deepEqual(read('delete', '/en/delete', ''), {
    locale: 'en',
    token: null,
    replaced: [],
  });
  assert.equal(read('delete', '/en/delete', '#%E0%A4%A').token, null);
});

test('accepts legacy path links and moves the token into the fragment', () => {
  assert.deepEqual(read('delete', '/de/delete/V1StGXR8_Z5jdHi6B-myT'), {
    locale: 'de',
    token: 'V1StGXR8_Z5jdHi6B-myT',
    replaced: ['/de/delete#V1StGXR8_Z5jdHi6B-myT'],
  });
  // The download page never had a path form.
  assert.deepEqual(read('download', '/de/download/abc'), {
    locale: 'de',
    token: null,
    replaced: [],
  });
  assert.deepEqual(read('delete', '/en/delete/%E0%A4%A'), {
    locale: 'en',
    token: null,
    replaced: [],
  });
});
