import { createMiddleware, ServiceContainer } from "@csi-foxbyte/fastify-toab";
import { getAuthService, getDatabaseService } from "../@internals/index.js";
import { AppError } from "../errors/app-error.js";
import type { User } from "../zenstack/models.js";
import type { AccessToken } from "./auth.dto.js";

type AuthMiddlewareOptions = {
  requiredRoles?: string[];
  resourceClientId?: string;
};

const resolveResourceClientId = (explicitClientId?: string): string => {
  if (explicitClientId) return explicitClientId;
  return process.env.AUTH_RESOURCE_ACCESS_CLIENT_ID || "digital-energy-twin";
};

const ensureRequiredRoles = (
  token: AccessToken,
  requiredRoles: string[],
  resourceClientId?: string,
): void => {
  if (requiredRoles.length === 0) return;

  const clientId = resolveResourceClientId(resourceClientId);

  const clientAccess = token.resource_access?.[clientId];
  const tokenRoles = clientAccess?.roles ?? [];
  const missingRoles = requiredRoles.filter(
    (role) => !tokenRoles.includes(role),
  );

  if (missingRoles.length > 0)
    throw new AppError({
      status: "FORBIDDEN",
      code: 403,
      message: `Missing required role(s): ${missingRoles.join(", ")}`,
    });
};

const upsertUser = async (
  services: ServiceContainer,
  token: AccessToken,
): Promise<User> => {
  if (!token.sub)
    throw new AppError({
      status: "UNAUTHORIZED",
      code: 401,
      message: "Access token is missing subject claim",
    });

  const db = await getDatabaseService(services);
  return db.user.upsert({
    where: { id: token.sub },
    create: {
      id: token.sub,
      email: token.email ?? token.preferred_username ?? token.sub,
      given_name: token.given_name ?? null,
      family_name: token.family_name ?? null,
    },
    update: {
      email: token.email ?? token.preferred_username ?? token.sub,
      given_name: token.given_name ?? null,
      family_name: token.family_name ?? null,
    },
  });
};

const createAuthMiddleware = (options: AuthMiddlewareOptions = {}) =>
  createMiddleware(async ({ ctx, services, request }, next) => {
    const authService = await getAuthService(services);
    const token = await authService.verifyRequest(request);

    ensureRequiredRoles(
      token,
      options.requiredRoles ?? [],
      options.resourceClientId,
    );

    const user = await upsertUser(services, token);

    const newCtx = { ...ctx, token, user };
    await next({ ctx: newCtx });
    return newCtx;
  });

export const authMiddleware = createAuthMiddleware();

export const authMiddlewareWithRoles = (
  requiredRoles: string[],
  options: Omit<AuthMiddlewareOptions, "requiredRoles"> = {},
) =>
  createAuthMiddleware({
    ...options,
    requiredRoles,
  });
