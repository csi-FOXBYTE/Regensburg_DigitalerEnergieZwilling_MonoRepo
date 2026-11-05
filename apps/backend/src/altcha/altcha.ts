import { createHmac, randomInt } from "node:crypto";
import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { createChallenge, verifySolution, type Challenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import type { FastifyInstance, FastifyRequest, onRequestHookHandler } from "fastify";
import { AppError } from "../errors/app-error.js";

// TA-51 / PLAT-05: public writes need a solved, unused Altcha challenge. The
// backend checks it itself instead of relying on a gateway policy.

/** Request header that carries the widget's base64 payload. */
export const ALTCHA_HEADER = "x-altcha";

/** Routes that must carry a solved challenge, as "METHOD /url". */
export const ALTCHA_PROTECTED_ROUTES: ReadonlySet<string> = new Set([
  "POST /api/public/submissions",
  "POST /api/public/feedback",
]);

// PBKDF2 runs natively in browsers (WebCrypto). In deterministic mode the
// server derives the key for a random counter and signs it; the browser has to
// try every counter from 0 up to it. With 1,000 iterations per counter this
// takes about 1.5 to 3 s on one core (less with the widget's parallel
// workers), while issuing costs one and verifying one HMAC.
export const ALTCHA_ALGORITHM = "PBKDF2/SHA-256";
export const ALTCHA_COST = 1_000;
export const ALTCHA_COUNTER_MIN = 5_000;
export const ALTCHA_COUNTER_MAX = 10_000;
// Long enough for slow devices (the widget gives up after 90 s), short enough
// to keep the replay store small.
export const ALTCHA_CHALLENGE_TTL_SECONDS = 300;

const MIN_KEY_LENGTH = 32;
// The widget's payload is about 700 characters.
const MAX_HEADER_LENGTH = 4_096;
const MAX_USED_CHALLENGES = 100_000;
const DEV_ENVS = new Set(["development", "test"]);

export type AltchaConfig =
  | { mode: "enabled"; hmacKey: string }
  // Only for automated tests and local development without the widget.
  | { mode: "disabled" };

export const resolveAltchaConfig = (
  env: Record<string, string | undefined> = process.env,
): AltchaConfig => {
  // An empty value (e.g. from a deployment template) means unset: enabled.
  if (env.ALTCHA_DISABLED) {
    if (env.ALTCHA_DISABLED !== "true")
      throw new Error('ALTCHA_DISABLED must be "true" or unset');
    if (!DEV_ENVS.has(env.NODE_ENV ?? ""))
      throw new Error(
        "ALTCHA_DISABLED is only allowed with NODE_ENV=development or NODE_ENV=test",
      );
    return { mode: "disabled" };
  }

  const hmacKey = env.ALTCHA_HMAC_KEY ?? "";
  if (hmacKey.length < MIN_KEY_LENGTH)
    throw new Error(
      `ALTCHA_HMAC_KEY must be set to a random secret of at least ${MIN_KEY_LENGTH} characters`,
    );
  return { mode: "enabled", hmacKey };
};

const HexString = Type.String({ pattern: "^[0-9a-f]+$", maxLength: 256 });

// Only the self-hosted proof-of-work payload. altcha-lib's framework helpers
// would also accept Sentinel server signatures, which this backend never uses.
const AltchaPayloadDto = Type.Object({
  challenge: Type.Object({
    parameters: Type.Object({
      algorithm: Type.Literal(ALTCHA_ALGORITHM),
      nonce: HexString,
      salt: HexString,
      cost: Type.Literal(ALTCHA_COST),
      keyLength: Type.Integer({ minimum: 1, maximum: 64 }),
      keyPrefix: HexString,
      keySignature: HexString,
      expiresAt: Type.Integer({ minimum: 1 }),
    }, { additionalProperties: false }),
    signature: HexString,
  }, { additionalProperties: false }),
  solution: Type.Object({
    counter: Type.Integer({ minimum: 0, maximum: 0xffffffff }),
    derivedKey: HexString,
    time: Type.Optional(Type.Number({ minimum: 0 })),
  }, { additionalProperties: false }),
}, { additionalProperties: false });
type AltchaPayload = Static<typeof AltchaPayloadDto>;

const forbidden = (message: string) =>
  new AppError({ status: "FORBIDDEN", code: 403, message });

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const parsePayload = (header: string | string[] | undefined): AltchaPayload => {
  if (header === undefined || header === "")
    throw forbidden("Altcha solution is missing");
  if (typeof header !== "string" || header.length > MAX_HEADER_LENGTH || !BASE64.test(header))
    throw forbidden("Altcha solution is invalid");

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    throw forbidden("Altcha solution is invalid");
  }
  if (!Value.Check(AltchaPayloadDto, payload))
    throw forbidden("Altcha solution is invalid");
  return payload;
};

/**
 * Challenges that were already accepted, kept until they expire. Lives in the
 * process: with more than one backend replica, a solution could be replayed
 * once per replica.
 */
export class UsedChallenges {
  private readonly entries = new Map<string, number>();

  constructor(
    private readonly maxEntries = MAX_USED_CHALLENGES,
    private readonly now: () => number = Date.now,
  ) {}

  get size() {
    return this.entries.size;
  }

  private sweep() {
    const now = this.now();
    for (const [key, expiresAtMs] of this.entries)
      if (expiresAtMs <= now) this.entries.delete(key);
  }

  /** Records the challenge; false if it was used before. Synchronous, hence atomic. */
  markUsed(key: string, expiresAtMs: number): boolean {
    const known = this.entries.get(key);
    if (known !== undefined && known > this.now()) return false;
    if (this.entries.size >= this.maxEntries) this.sweep();
    // Fail closed instead of forgetting unexpired challenges, which would
    // allow them to be replayed.
    if (this.entries.size >= this.maxEntries)
      throw new AppError({
        status: "SERVICE_UNAVAILABLE",
        code: 503,
        message: "Service unavailable",
      });
    this.entries.set(key, expiresAtMs);
    return true;
  }
}

export type Altcha = {
  readonly enabled: boolean;
  createChallenge(): Promise<Challenge>;
  /** Throws a 403 AppError unless the header carries a valid, unused solution. */
  verify(header: string | string[] | undefined): Promise<void>;
};

export type AltchaOptions = {
  now?: () => number;
  usedChallenges?: UsedChallenges;
  /** For tests: a small counter keeps solving fast. */
  randomCounter?: () => number;
};

export const createAltcha = (config: AltchaConfig, options: AltchaOptions = {}): Altcha => {
  if (config.mode === "disabled")
    return {
      enabled: false,
      createChallenge: async () => {
        throw new AppError({ status: "NOT_FOUND", code: 404, message: "Altcha is disabled" });
      },
      verify: async () => {},
    };

  const now = options.now ?? Date.now;
  const randomCounter =
    options.randomCounter ?? (() => randomInt(ALTCHA_COUNTER_MIN, ALTCHA_COUNTER_MAX + 1));
  const usedChallenges = options.usedChallenges ?? new UsedChallenges(MAX_USED_CHALLENGES, now);
  const hmacSignatureSecret = config.hmacKey;
  // A separate secret for the derived-key signatures, from the same key.
  const hmacKeySignatureSecret = createHmac("sha256", config.hmacKey)
    .update("altcha-key-signature")
    .digest("hex");

  return {
    enabled: true,

    createChallenge: () =>
      createChallenge({
        algorithm: ALTCHA_ALGORITHM,
        cost: ALTCHA_COST,
        counter: randomCounter(),
        deriveKey,
        expiresAt: Math.floor(now() / 1_000) + ALTCHA_CHALLENGE_TTL_SECONDS,
        hmacSignatureSecret,
        hmacKeySignatureSecret,
      }),

    async verify(header) {
      const payload = parsePayload(header);
      const { parameters } = payload.challenge;
      // altcha-lib compares expiresAt with the wall clock; checked here as
      // well so the injected clock applies.
      if (parameters.expiresAt * 1_000 <= now())
        throw forbidden("Altcha challenge has expired");

      let result: Awaited<ReturnType<typeof verifySolution>>;
      try {
        result = await verifySolution({
          challenge: payload.challenge,
          solution: payload.solution,
          deriveKey,
          hmacSignatureSecret,
          hmacKeySignatureSecret,
        });
      } catch {
        throw forbidden("Altcha solution is invalid");
      }
      if (result.expired) throw forbidden("Altcha challenge has expired");
      if (!result.verified) throw forbidden("Altcha solution is invalid");

      // Only after verification, so unsigned payloads cannot fill the store.
      if (!usedChallenges.markUsed(payload.challenge.signature, parameters.expiresAt * 1_000))
        throw forbidden("Altcha solution has already been used");
    },
  };
};

let sharedAltcha: Altcha | undefined;

/** The process-wide instance, configured from the environment on first use. */
export const getAltcha = (): Altcha => {
  sharedAltcha ??= createAltcha(resolveAltchaConfig());
  return sharedAltcha;
};

const routeKeys = (method: string | string[], url: string) => {
  const path = url.length > 1 ? url.replace(/\/+$/, "") : url;
  return (Array.isArray(method) ? method : [method]).map(
    (value) => `${value.toUpperCase()} ${path}`,
  );
};

/**
 * Checks the solution in onRequest, before the body is parsed or validated,
 * on every route in `routes`. Install before the API routes are registered.
 */
export function installAltchaGuard(
  fastify: FastifyInstance,
  altcha: Altcha,
  routes: ReadonlySet<string> = ALTCHA_PROTECTED_ROUTES,
) {
  if (!altcha.enabled) return;

  const guard: onRequestHookHandler = async (request: FastifyRequest) => {
    await altcha.verify(request.headers[ALTCHA_HEADER]);
  };

  fastify.addHook("onRoute", (route) => {
    if (!routeKeys(route.method, route.url).some((key) => routes.has(key))) return;
    const existing = route.onRequest;
    route.onRequest = [
      guard,
      ...(existing === undefined ? [] : Array.isArray(existing) ? existing : [existing]),
    ];
  });
}
