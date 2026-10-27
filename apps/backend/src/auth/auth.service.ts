import { createService } from "@csi-foxbyte/fastify-toab";
import { Value } from "@sinclair/typebox/value";
import type { FastifyRequest } from "fastify";
import {
  createRemoteJWKSet,
  decodeJwt,
  errors as joseErrors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import { AppError } from "../errors/app-error.js";
import { AccessTokenDto, type AccessToken } from "./auth.dto.js";

type HeaderValue = string | string[] | undefined;

const DEV_ENVS = new Set(["development", "test"]);

// Keycloak marks access tokens with typ "Bearer"; ID and refresh tokens differ.
const ACCESS_TOKEN_TYPE = "Bearer";
const ACCESS_TOKEN_HEADER_TYPES = new Set(["jwt", "at+jwt", "application/at+jwt"]);

export type AuthConfig =
  | { mode: "verify"; jwksUri: URL; issuer: string; audience: string }
  // Decodes without a signature check. Only for local development with
  // gateway-free dev tokens (scripts/create-dev-jwt.mjs).
  | { mode: "insecure-dev-decode" };

export const resolveAuthConfig = (
  env: Record<string, string | undefined> = process.env,
): AuthConfig => {
  const nodeEnv = env.NODE_ENV ?? "";

  if (env.AUTH_INSECURE_DEV_DECODE !== undefined) {
    if (env.AUTH_INSECURE_DEV_DECODE !== "true")
      throw new Error('AUTH_INSECURE_DEV_DECODE must be "true" or unset');
    if (!DEV_ENVS.has(nodeEnv))
      throw new Error(
        "AUTH_INSECURE_DEV_DECODE is only allowed with NODE_ENV=development or NODE_ENV=test",
      );
    return { mode: "insecure-dev-decode" };
  }

  let jwksUri: URL;
  try {
    jwksUri = new URL(env.KEYCLOAK_JWKS_URI ?? "");
  } catch {
    throw new Error("KEYCLOAK_JWKS_URI is missing or invalid");
  }
  if (jwksUri.protocol !== "https:")
    throw new Error("KEYCLOAK_JWKS_URI must use HTTPS");

  const issuer = env.KEYCLOAK_ISSUER;
  if (!issuer) throw new Error("KEYCLOAK_ISSUER is not configured");
  const audience = env.AUTH_EXPECTED_AUDIENCE;
  if (!audience) throw new Error("AUTH_EXPECTED_AUDIENCE is not configured");

  return { mode: "verify", jwksUri, issuer, audience };
};

const invalidToken = (message = "Access token is invalid") =>
  new AppError({ status: "UNAUTHORIZED", code: 401, message });

const toAccessToken = (payload: JWTPayload): AccessToken => {
  if (!Value.Check(AccessTokenDto, payload))
    throw invalidToken("Access token payload is invalid");
  return payload;
};

export const createAccessTokenVerifier = (
  config: AuthConfig,
  getKey: JWTVerifyGetKey | null = config.mode === "verify"
    ? createRemoteJWKSet(config.jwksUri)
    : null,
) => {
  if (config.mode === "verify") {
    if (!getKey) throw new Error("A JWKS is required to verify access tokens");

    return async (accessToken: string): Promise<AccessToken> => {
      let payload: JWTPayload;
      try {
        const result = await jwtVerify(accessToken, getKey, {
          algorithms: ["RS256"],
          issuer: config.issuer,
          audience: config.audience,
          requiredClaims: ["exp", "iat", "sub"],
          clockTolerance: 5,
        });
        const headerType = result.protectedHeader.typ?.toLowerCase();
        if (headerType !== undefined && !ACCESS_TOKEN_HEADER_TYPES.has(headerType))
          throw invalidToken();
        if (result.payload.typ !== ACCESS_TOKEN_TYPE) throw invalidToken();
        payload = result.payload;
      } catch (err) {
        if (err instanceof AppError) throw err;
        if (err instanceof joseErrors.JWTExpired)
          throw invalidToken("Access token has expired");
        if (
          err instanceof joseErrors.JWTClaimValidationFailed &&
          err.claim === "nbf"
        )
          throw invalidToken("Access token is not active yet");
        throw invalidToken();
      }
      return toAccessToken(payload);
    };
  }

  return async (accessToken: string): Promise<AccessToken> => {
    let payload: JWTPayload;
    try {
      payload = decodeJwt(accessToken);
    } catch {
      throw invalidToken("Access token payload is invalid");
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp <= now)
      throw invalidToken("Access token has expired");
    if (typeof payload.nbf === "number" && payload.nbf > now)
      throw invalidToken("Access token is not active yet");

    return toAccessToken(payload);
  };
};

const authService = createService("auth", async () => {
  const verifyAccessToken = createAccessTokenVerifier(resolveAuthConfig());

  const asSingleHeader = (value: HeaderValue): string | null => {
    if (Array.isArray(value))
      throw new AppError({
        status: "BAD_REQUEST",
        code: 400,
        message: "Request header is malformed",
      });
    if (typeof value !== "string" || value.length === 0) return null;
    return value;
  };

  const parseAuthorizationHeader = (authorizationHeader: string): string => {
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token)
      throw new AppError({
        status: "UNAUTHORIZED",
        code: 401,
        message: "Authorization header must be a Bearer token",
      });
    return token;
  };

  const parseAccessTokenHeader = (accessTokenHeader: string): string => {
    if (accessTokenHeader.toLowerCase().startsWith("bearer "))
      return parseAuthorizationHeader(accessTokenHeader);
    return accessTokenHeader;
  };

  const resolveAccessTokenFromRequest = (request: FastifyRequest): string => {
    const accessTokenHeader = asSingleHeader(request.headers["x-access-token"]);
    const authorizationHeader = asSingleHeader(request.headers.authorization);

    if (accessTokenHeader) return parseAccessTokenHeader(accessTokenHeader);
    if (authorizationHeader)
      return parseAuthorizationHeader(authorizationHeader);

    throw new AppError({
      status: "UNAUTHORIZED",
      code: 401,
      message: "Access token is missing",
    });
  };

  const verifyRequest = async (
    request: FastifyRequest,
  ): Promise<AccessToken> => {
    const accessToken = resolveAccessTokenFromRequest(request);
    return verifyAccessToken(accessToken);
  };

  return {
    verifyAccessToken,
    verifyRequest,
  };
}, {
  // Resolve at startup so a misconfigured or forbidden auth mode stops the server.
  buildTime: "INSTANT",
});

export default authService;
