import { createMiddleware } from "@csi-foxbyte/fastify-toab";
import { getAuthService } from "../@internals/index.js";
import type { AccessToken } from "../auth/auth.dto.js";
import { AppError } from "../errors/app-error.js";

export type Action = "read" | "update" | "create" | "delete";
export type Area = "config" | "feedback" | "submissions";
export type Permission = `${Area}:${Action}`;
export type Role = "admin" | "manager" | "maintainer";

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "submissions:read", "submissions:create", "submissions:update", "submissions:delete",
    "config:read", "config:create", "config:update", "config:delete",
    "feedback:read", "feedback:delete",
  ],
  manager: [
    "submissions:read", "submissions:create", "submissions:update", "submissions:delete",
  ],
  maintainer: [
    "config:read", "config:create", "config:update", "config:delete",
    "feedback:read", "feedback:delete",
  ],
};

const resolveClientId = (explicitClientId?: string): string => {
  if (explicitClientId) return explicitClientId;
  return process.env.AUTH_RESOURCE_ACCESS_CLIENT_ID ?? "digital-energy-twin";
};

const ensurePermission = (
  token: AccessToken,
  permission: Permission,
  resourceClientId?: string,
): void => {
  const clientId = resolveClientId(resourceClientId);
  const tokenRoles = token.resource_access?.[clientId]?.roles ?? [];
  const hasPermission = tokenRoles.some(
    (role) => rolePermissions[role as Role]?.includes(permission),
  );

  if (!hasPermission)
    throw new AppError({
      status: "FORBIDDEN",
      code: 403,
      message: `Missing required permission: ${permission}`,
    });
};

type PermissionMiddlewareOptions = {
  resourceClientId?: string;
};

const createPermissionMiddleware = (permission: Permission, options: PermissionMiddlewareOptions = {}) =>
  createMiddleware(async ({ ctx, services, request }, next) => {
    const authService = await getAuthService(services);
    const token = await authService.verifyRequest(request);

    ensurePermission(token, permission, options.resourceClientId);

    await next({ ctx });
    return ctx;
  });

export const requirePermission = (
  permission: Permission,
  options: PermissionMiddlewareOptions = {},
) => createPermissionMiddleware(permission, options);
