import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { solveChallenge, type Challenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import feedbackPublicController from "../feedbackPublic/feedbackPublic.controller.js";
import { createGuardedTestApp } from "../lib/guarded-test-app.js";
import { validSubmission } from "../submissions/submission-input.fixture.js";
import submissionsPublicController from "../submissionsPublic/submissionsPublic.controller.js";
import altchaController from "./altcha.controller.js";
import {
  ALTCHA_ALGORITHM,
  ALTCHA_CHALLENGE_TTL_SECONDS,
  ALTCHA_COST,
  createAltcha,
  resolveAltchaConfig,
  UsedChallenges,
  type AltchaOptions,
} from "./altcha.js";

const HMAC_KEY = "k".repeat(32);

const submissionBody = validSubmission();
const feedbackBody = { category: "bug", message: "Something broke" };

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64");

const solve = async (challenge: Challenge) => {
  const solution = await solveChallenge({ challenge, deriveKey });
  assert.ok(solution);
  return { challenge: { parameters: challenge.parameters, signature: challenge.signature }, solution };
};

const createTestApp = async (options: AltchaOptions = {}) => {
  const altcha = createAltcha(
    { mode: "enabled", hmacKey: HMAC_KEY },
    // A small counter keeps the proof of work in the tests fast.
    { randomCounter: () => 3, ...options },
  );
  const submit = mock.fn(async () => ({ deletionToken: "token" }));
  const create = mock.fn(async () => ({}));
  const app = await createGuardedTestApp(
    [altchaController, submissionsPublicController, feedbackPublicController],
    // Every service resolves to this object: altcha, submissions and feedback.
    { ...altcha, submit, create },
    { altcha },
  );

  const fetchChallenge = async () => {
    const response = await app.inject({ method: "GET", url: "/api/public/altcha/challenge" });
    assert.equal(response.statusCode, 200);
    return response.json() as Challenge;
  };
  const solvedHeader = async () => encode(await solve(await fetchChallenge()));
  const post = (url: string, payload: object, altchaHeader?: string) =>
    app.inject({
      method: "POST",
      url,
      payload,
      headers: altchaHeader === undefined ? {} : { "x-altcha": altchaHeader },
    });

  return { app, submit, create, fetchChallenge, solvedHeader, post };
};

const assertForbidden = (
  response: { statusCode: number; json: () => unknown },
  message: RegExp,
) => {
  assert.equal(response.statusCode, 403);
  // The generic ERROR_403 response schema (status, message) has no `code`.
  const body = response.json() as Record<string, unknown>;
  assert.deepEqual(Object.keys(body).sort(), ["message", "status"]);
  assert.equal(body.status, "FORBIDDEN");
  assert.match(String(body.message), message);
};

describe("Altcha configuration", () => {
  it("requires a long HMAC key unless explicitly disabled in development or test", () => {
    assert.throws(() => resolveAltchaConfig({ NODE_ENV: "production" }), /ALTCHA_HMAC_KEY/);
    assert.throws(() => resolveAltchaConfig({ ALTCHA_HMAC_KEY: "short" }), /ALTCHA_HMAC_KEY/);
    assert.deepEqual(resolveAltchaConfig({ ALTCHA_HMAC_KEY: HMAC_KEY, ALTCHA_DISABLED: "" }), {
      mode: "enabled",
      hmacKey: HMAC_KEY,
    });

    for (const NODE_ENV of ["production", "", undefined])
      assert.throws(
        () => resolveAltchaConfig({ ALTCHA_DISABLED: "true", NODE_ENV }),
        /only allowed with NODE_ENV=development or NODE_ENV=test/,
      );
    assert.throws(() => resolveAltchaConfig({ ALTCHA_DISABLED: "1", NODE_ENV: "test" }), /"true" or unset/);
    assert.deepEqual(resolveAltchaConfig({ ALTCHA_DISABLED: "true", NODE_ENV: "test" }), { mode: "disabled" });
  });
});

describe("Altcha challenge and public writes", () => {
  it("issues signed, expiring, uncached challenges", async (t) => {
    const now = Date.UTC(2026, 10, 4, 12);
    const { app } = await createTestApp({ now: () => now, randomCounter: undefined });
    t.after(() => app.close());

    const response = await app.inject({ method: "GET", url: "/api/public/altcha/challenge" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "no-store");
    const challenge = response.json() as Challenge;
    assert.equal(challenge.parameters.algorithm, ALTCHA_ALGORITHM);
    assert.equal(challenge.parameters.cost, ALTCHA_COST);
    assert.equal(challenge.parameters.expiresAt, now / 1_000 + ALTCHA_CHALLENGE_TTL_SECONDS);
    assert.match(challenge.parameters.keySignature ?? "", /^[0-9a-f]{64}$/);
    assert.match(challenge.signature ?? "", /^[0-9a-f]{64}$/);
  });

  it("accepts a valid solution on both public write endpoints", async (t) => {
    const { app, submit, create, solvedHeader, post } = await createTestApp();
    t.after(() => app.close());

    const submission = await post("/api/public/submissions", submissionBody, await solvedHeader());
    assert.equal(submission.statusCode, 200, submission.body);
    assert.deepEqual(submission.json(), { deletionToken: "token" });
    assert.equal(submit.mock.callCount(), 1);

    const feedback = await post("/api/public/feedback", feedbackBody, await solvedHeader());
    assert.equal(feedback.statusCode, 201, feedback.body);
    assert.equal(create.mock.callCount(), 1);
  });

  it("rejects missing solutions before parsing or validating the body", async (t) => {
    const { app, submit, create, post } = await createTestApp();
    t.after(() => app.close());

    assertForbidden(await post("/api/public/submissions", submissionBody), /missing/);
    assertForbidden(await post("/api/public/feedback", feedbackBody), /missing/);
    assertForbidden(await post("/api/public/feedback", feedbackBody, ""), /missing/);
    // An invalid body is not even looked at.
    assertForbidden(await post("/api/public/feedback", { unexpected: true }), /missing/);
    assertForbidden(
      await app.inject({
        method: "POST",
        url: "/api/public/submissions",
        headers: { "content-type": "application/json" },
        payload: "{not json",
      }),
      /missing/,
    );
    assert.equal(submit.mock.callCount(), 0);
    assert.equal(create.mock.callCount(), 0);
  });

  it("rejects malformed, forged and wrong solutions", async (t) => {
    const { app, submit, fetchChallenge, post } = await createTestApp();
    t.after(() => app.close());

    const valid = await solve(await fetchChallenge());
    const otherKey = createAltcha({ mode: "enabled", hmacKey: "o".repeat(32) }, { randomCounter: () => 3 });
    const forged = await solve(await otherKey.createChallenge());
    const invalid = [
      "not base64!",
      Buffer.from("not json").toString("base64"),
      "A".repeat(5_000),
      // The widget's test mode.
      encode({ challenge: null, solution: null, test: true }),
      // A Sentinel server signature instead of a proof of work.
      encode({ algorithm: "SHA-256", signature: "00", verificationData: "verified=true", verified: true }),
      encode({ ...valid, extra: true }),
      // The signed derived key is the proof; the counter is not checked again.
      encode({ challenge: valid.challenge, solution: { ...valid.solution, derivedKey: "00".repeat(32) } }),
      encode({ challenge: { ...valid.challenge, signature: "0".repeat(64) }, solution: valid.solution }),
      encode({
        challenge: {
          ...valid.challenge,
          parameters: { ...valid.challenge.parameters, expiresAt: (valid.challenge.parameters.expiresAt ?? 0) + 3_600 },
        },
        solution: valid.solution,
      }),
      encode({
        challenge: { parameters: { ...valid.challenge.parameters, keySignature: undefined }, signature: valid.challenge.signature },
        solution: valid.solution,
      }),
      // Signed with another key.
      encode(forged),
    ];
    for (const [index, header] of invalid.entries()) {
      const response = await post("/api/public/submissions", submissionBody, header);
      assert.equal(response.statusCode, 403, `case ${index}`);
      assertForbidden(response, /invalid/);
    }

    // A duplicated header arrives as a list.
    const duplicated = await app.inject({
      method: "POST",
      url: "/api/public/submissions",
      payload: submissionBody,
      headers: { "x-altcha": [encode(valid), encode(valid)] },
    });
    assertForbidden(duplicated, /invalid/);
    assert.equal(submit.mock.callCount(), 0);

    // None of the rejected attempts used up the valid solution.
    const accepted = await post("/api/public/submissions", submissionBody, encode(valid));
    assert.equal(accepted.statusCode, 200, accepted.body);
  });

  it("rejects expired challenges", async (t) => {
    let now = Date.now();
    const { app, submit, solvedHeader, post } = await createTestApp({ now: () => now });
    t.after(() => app.close());

    const header = await solvedHeader();
    now += ALTCHA_CHALLENGE_TTL_SECONDS * 1_000;
    assertForbidden(await post("/api/public/submissions", submissionBody, header), /expired/);
    assert.equal(submit.mock.callCount(), 0);
  });

  it("accepts each solution only once, across both endpoints", async (t) => {
    const { app, submit, create, solvedHeader, post } = await createTestApp();
    t.after(() => app.close());

    const header = await solvedHeader();
    assert.equal((await post("/api/public/submissions", submissionBody, header)).statusCode, 200);
    assertForbidden(await post("/api/public/submissions", submissionBody, header), /already been used/);
    assertForbidden(await post("/api/public/feedback", feedbackBody, header), /already been used/);

    // Concurrent replays: exactly one wins.
    const concurrent = await solvedHeader();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => post("/api/public/feedback", feedbackBody, concurrent)),
    );
    assert.deepEqual(responses.map((response) => response.statusCode).sort(), [201, 403, 403, 403, 403]);
    assert.equal(submit.mock.callCount(), 1);
    assert.equal(create.mock.callCount(), 1);
  });

  it("leaves the other public routes alone", async (t) => {
    const { app, post } = await createTestApp();
    t.after(() => app.close());

    // Reaches validation instead of the Altcha check.
    const response = await post("/api/public/submissions/status", {});
    assert.equal(response.statusCode, 400);
  });

  it("checks nothing and issues no challenges when disabled", async (t) => {
    const altcha = createAltcha({ mode: "disabled" });
    const create = mock.fn(async () => ({}));
    const app = await createGuardedTestApp(
      [altchaController, feedbackPublicController],
      { ...altcha, create },
      { altcha },
    );
    t.after(() => app.close());

    const challenge = await app.inject({ method: "GET", url: "/api/public/altcha/challenge" });
    assert.equal(challenge.statusCode, 404);
    const feedback = await app.inject({ method: "POST", url: "/api/public/feedback", payload: feedbackBody });
    assert.equal(feedback.statusCode, 201);
  });
});

describe("used challenge store", () => {
  it("forgets challenges once they expire and fails closed when full", () => {
    let now = 1_000;
    const store = new UsedChallenges(2, () => now);
    assert.equal(store.markUsed("a", 2_000), true);
    assert.equal(store.markUsed("a", 2_000), false);
    assert.equal(store.markUsed("b", 5_000), true);
    assert.throws(() => store.markUsed("c", 5_000), { code: 503 });

    now = 2_000;
    assert.equal(store.markUsed("c", 5_000), true);
    assert.equal(store.size, 2);
  });
});
