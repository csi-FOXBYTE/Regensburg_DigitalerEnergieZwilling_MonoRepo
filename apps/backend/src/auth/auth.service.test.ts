import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";
import { AppError } from "../errors/app-error.js";
import authServiceDefinition, {
  createAccessTokenVerifier,
  resolveAuthConfig,
  type AuthConfig,
} from "./auth.service.js";

const issuer = "https://keycloak.example/realms/det";
const audience = "digital-energy-twin";
const productionEnv = {
  NODE_ENV: "production",
  KEYCLOAK_JWKS_URI: `${issuer}/protocol/openid-connect/certs`,
  KEYCLOAK_ISSUER: issuer,
  AUTH_EXPECTED_AUDIENCE: audience,
};
const verifyConfig = resolveAuthConfig(productionEnv);

let signingKey: CryptoKey;
let foreignKey: CryptoKey;
let jwks: JWTVerifyGetKey;

before(async () => {
  const realmKeys = await generateKeyPair("RS256", { extractable: true });
  const foreignKeys = await generateKeyPair("RS256");
  signingKey = realmKeys.privateKey;
  foreignKey = foreignKeys.privateKey;
  jwks = createLocalJWKSet({
    keys: [{ ...(await exportJWK(realmKeys.publicKey)), kid: "realm", alg: "RS256" }],
  });
});

const signToken = async (
  claims: Record<string, unknown> = {},
  key: CryptoKey = signingKey,
) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = Object.fromEntries(
    Object.entries({
      typ: "Bearer",
      azp: audience,
      resource_access: { [audience]: { roles: ["Administrator"] } },
      iss: issuer,
      aud: audience,
      sub: "user-1",
      iat: now,
      exp: now + 300,
      ...claims,
    }).filter(([, value]) => value !== undefined),
  );
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: "realm", typ: "JWT" })
    .sign(key);
};

const rejectsUnauthorized = (promise: Promise<unknown>, message?: string) =>
  assert.rejects(
    promise,
    (error: unknown) =>
      error instanceof AppError &&
      error.code === 401 &&
      (message === undefined || error.message === message),
  );

const withEnv = (
  t: { after: (fn: () => void) => void },
  values: Record<string, string | undefined>,
) => {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  });
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
};

describe("auth configuration", () => {
  it("verifies signatures by default and requires HTTPS, issuer and audience", () => {
    assert.deepEqual(verifyConfig, {
      mode: "verify",
      jwksUri: new URL(productionEnv.KEYCLOAK_JWKS_URI),
      issuer,
      audience,
    });
    assert.equal(resolveAuthConfig({ ...productionEnv, NODE_ENV: "development" }).mode, "verify");

    assert.throws(
      () => resolveAuthConfig({ ...productionEnv, KEYCLOAK_JWKS_URI: "http://keycloak.example/certs" }),
      /HTTPS/,
    );
    assert.throws(() => resolveAuthConfig({ ...productionEnv, KEYCLOAK_JWKS_URI: "not a url" }), /invalid/);
    assert.throws(() => resolveAuthConfig({ ...productionEnv, KEYCLOAK_ISSUER: "" }), /KEYCLOAK_ISSUER/);
    assert.throws(
      () => resolveAuthConfig({ ...productionEnv, AUTH_EXPECTED_AUDIENCE: undefined }),
      /AUTH_EXPECTED_AUDIENCE/,
    );
  });

  it("allows the unsigned dev decode only as an explicit opt-in outside production", () => {
    assert.deepEqual(
      resolveAuthConfig({ NODE_ENV: "development", AUTH_INSECURE_DEV_DECODE: "true" }),
      { mode: "insecure-dev-decode" },
    );
    assert.deepEqual(
      resolveAuthConfig({ NODE_ENV: "test", AUTH_INSECURE_DEV_DECODE: "true" }),
      { mode: "insecure-dev-decode" },
    );

    for (const nodeEnv of ["production", "staging", undefined])
      assert.throws(
        () => resolveAuthConfig({ ...productionEnv, NODE_ENV: nodeEnv, AUTH_INSECURE_DEV_DECODE: "true" }),
        /only allowed/,
      );
    assert.throws(
      () => resolveAuthConfig({ NODE_ENV: "development", AUTH_INSECURE_DEV_DECODE: "1" }),
      /must be "true"/,
    );
  });

  it("refuses to start the service with the dev decode in production", async (t) => {
    withEnv(t, { ...productionEnv, AUTH_INSECURE_DEV_DECODE: "true" });
    await assert.rejects(
      authServiceDefinition.factory({} as never),
      /only allowed/,
    );
  });

  it("verifies signatures in production mode instead of decoding", async (t) => {
    // Port 9 (discard) on loopback: an unsigned or HS256 token must fail
    // before any key would be fetched.
    withEnv(t, {
      ...productionEnv,
      KEYCLOAK_JWKS_URI: "https://127.0.0.1:9/certs",
      AUTH_INSECURE_DEV_DECODE: undefined,
    });
    const service = await authServiceDefinition.factory({} as never);
    const hs256Token = await new SignJWT({ typ: "Bearer" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode("dev_admin-secret-change-me"));
    const unsignedToken = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(
      JSON.stringify({ sub: "user-1", iss: issuer, aud: audience, typ: "Bearer" }),
    ).toString("base64url")}.`;

    await rejectsUnauthorized(service.verifyAccessToken(hs256Token));
    await rejectsUnauthorized(service.verifyAccessToken(unsignedToken));
  });
});

describe("access token verification", () => {
  const verify = (config: AuthConfig = verifyConfig) => createAccessTokenVerifier(config, jwks);

  it("accepts a realm access token for the expected audience", async () => {
    const token = await verify()(await signToken({ email: "admin@example.de" }));
    assert.equal(token.sub, "user-1");
    assert.equal(token.email, "admin@example.de");
    assert.deepEqual(token.resource_access?.[audience]?.roles, ["Administrator"]);
  });

  it("rejects a token signed with another key", async () => {
    await rejectsUnauthorized(verify()(await signToken({}, foreignKey)), "Access token is invalid");
  });

  it("rejects a wrong issuer or audience", async () => {
    await rejectsUnauthorized(verify()(await signToken({ iss: "https://keycloak.example/realms/other" })));
    await rejectsUnauthorized(verify()(await signToken({ aud: "account" })));
  });

  it("rejects ID tokens and tokens issued for another client", async () => {
    await rejectsUnauthorized(verify()(await signToken({ typ: "ID" })));
    await rejectsUnauthorized(verify()(await signToken({ typ: "Refresh" })));
    await rejectsUnauthorized(verify()(await signToken({ aud: "other-client", azp: "other-client" })));
  });

  it("requires exp, iat and sub", async () => {
    await rejectsUnauthorized(verify()(await signToken({ exp: undefined })));
    await rejectsUnauthorized(verify()(await signToken({ sub: undefined })));
    await rejectsUnauthorized(verify()(await signToken({ iat: undefined })));
  });

  it("rejects expired tokens beyond the clock tolerance", async () => {
    const now = Math.floor(Date.now() / 1000);
    await rejectsUnauthorized(
      verify()(await signToken({ exp: now - 30 })),
      "Access token has expired",
    );
    assert.equal((await verify()(await signToken({ exp: now - 2 }))).sub, "user-1");
  });

  it("validates the payload shape instead of trusting it", async () => {
    await rejectsUnauthorized(
      verify()(await signToken({ resource_access: { [audience]: { roles: "Administrator" } } })),
      "Access token payload is invalid",
    );
  });

  it("decodes without a signature only in the opted-in dev mode", async () => {
    const devVerify = createAccessTokenVerifier({ mode: "insecure-dev-decode" });
    const now = Math.floor(Date.now() / 1000);
    assert.equal((await devVerify(await signToken({}, foreignKey))).sub, "user-1");
    await rejectsUnauthorized(devVerify("not-a-jwt"), "Access token payload is invalid");
    await rejectsUnauthorized(
      devVerify(await signToken({ exp: now - 1 })),
      "Access token has expired",
    );
  });
});
