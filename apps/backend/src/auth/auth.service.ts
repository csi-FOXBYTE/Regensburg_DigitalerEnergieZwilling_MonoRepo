import { createService } from "@csi-foxbyte/fastify-toab";
import type { FastifyRequest } from "fastify";
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from "jose";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error.js";
import type { AccessToken } from "./auth.dto.js";

type HeaderValue = string | string[] | undefined;

const DEV_ENVS = new Set(["development", "test"]);

const authService = createService("auth", async () => {
  const isDevEnv = DEV_ENVS.has(process.env.NODE_ENV ?? "");
  const jwks = isDevEnv
    ? null
    : createRemoteJWKSet(new URL(process.env.KEYCLOAK_JWKS_URI!));

  if (!isDevEnv && jwks === null)
    throw new AppError({
      status: "INTERNAL_ERROR",
      code: 500,
      message: "JWKS is null in a non-development environment. KEYCLOAK_JWKS_URI may be misconfigured.",
    });

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

  const verifyAccessToken = async (
    accessToken: string,
  ): Promise<AccessToken> => {
    if (!isDevEnv) {
      if (jwks === null)
        throw new AppError({
          status: "INTERNAL_ERROR",
          code: 500,
          message: "JWKS is null in a non-development environment. JWT verification cannot proceed.",
        });
      try {
        const { payload } = await jwtVerify(accessToken, jwks, {
          algorithms: ["RS256"],
        });
        return payload as AccessToken;
      } catch (err) {
        if (err instanceof joseErrors.JWTExpired)
          throw new AppError({
            status: "UNAUTHORIZED",
            code: 401,
            message: "Access token has expired",
          });
        if (
          err instanceof joseErrors.JWTClaimValidationFailed &&
          err.claim === "nbf"
        )
          throw new AppError({
            status: "UNAUTHORIZED",
            code: 401,
            message: "Access token is not active yet",
          });
        throw new AppError({
          status: "UNAUTHORIZED",
          code: 401,
          message: "Access token is invalid",
        });
      }
    }

    const decoded = jwt.decode(accessToken);
    if (!decoded || typeof decoded === "string")
      throw new AppError({
        status: "UNAUTHORIZED",
        code: 401,
        message: "Access token payload is invalid",
      });
    const payload = decoded as AccessToken;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp <= now)
      throw new AppError({
        status: "UNAUTHORIZED",
        code: 401,
        message: "Access token has expired",
      });
    if (typeof payload.nbf === "number" && payload.nbf > now)
      throw new AppError({
        status: "UNAUTHORIZED",
        code: 401,
        message: "Access token is not active yet",
      });

    return payload;
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
});

export default authService;
