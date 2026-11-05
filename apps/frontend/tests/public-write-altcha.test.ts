import assert from 'node:assert/strict';
import test from 'node:test';
import { ALTCHA_HEADER } from '../src/lib/api/altcha';
import { submitEnergyData, submitFeedback } from '../src/lib/api/public';

type Call = { url: string; init: RequestInit };

function mockFetch(t: test.TestContext, response: () => Response) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return response();
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  return calls;
}

const submission = {
  input: { general: {} },
  buildingId: 'building-1',
  address: 'Musterstraße 1',
  longitude: 12.1,
  latitude: 49,
};

test('public writes carry a freshly solved Altcha payload in a header', async (t) => {
  const calls = mockFetch(
    t,
    () =>
      new Response(JSON.stringify({ deletionToken: 'token' }), { status: 200 }),
  );
  let solved = 0;
  const solve = async () => `payload-${++solved}`;

  assert.deepEqual(await submitEnergyData(submission, solve), {
    deletionToken: 'token',
  });
  await submitFeedback(
    { category: 'bug', message: 'Broken', emailAddress: ' ' },
    solve,
  );

  assert.deepEqual(
    calls.map(({ url, init }) => [
      url,
      init.method,
      (init.headers as Record<string, string>)[ALTCHA_HEADER],
      JSON.parse(String(init.body)),
    ]),
    [
      ['/api/public/submissions', 'POST', 'payload-1', submission],
      [
        '/api/public/feedback',
        'POST',
        'payload-2',
        { category: 'bug', message: 'Broken' },
      ],
    ],
  );
  // The backend reads this header; the request bodies reject unknown fields.
  assert.equal(ALTCHA_HEADER, 'X-Altcha');
});

test('no request is sent when the challenge cannot be solved', async (t) => {
  const calls = mockFetch(t, () => new Response(null, { status: 201 }));
  const fail = async () => {
    throw new Error('Altcha verification failed');
  };

  await assert.rejects(
    submitFeedback({ category: 'bug', message: 'Broken' }, fail),
    /Altcha/,
  );
  await assert.rejects(submitEnergyData(submission, fail), /Altcha/);
  assert.equal(calls.length, 0);
});

test('a rejected solution surfaces as an error', async (t) => {
  mockFetch(
    t,
    () =>
      new Response(
        JSON.stringify({
          status: 'FORBIDDEN',
          message: 'Altcha solution has already been used',
        }),
        {
          status: 403,
        },
      ),
  );
  await assert.rejects(
    submitFeedback(
      { category: 'bug', message: 'Broken' },
      async () => 'payload',
    ),
    /HTTP 403/,
  );
});
