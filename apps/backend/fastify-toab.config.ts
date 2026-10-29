import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type FastifyToabConfigOptions } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";
import { allowedCorsOrigins, createCorsOrigin } from "./src/lib/cors.js";
import { requestErrorHandler } from "./src/errors/request-error-handler.js";
import { routeErrorHandler } from "./src/errors/route-error-handler.js";

// fastify-toab 0.2.0-rc.4's CLI reads the module namespace, not its default export.
// Also export this setting by name so Pino's transport workers stay in node_modules.
export const rolldown = {
  external: ["pino"],
  plugins: [{
    name: "feedback-mail-template",
    async buildStart() {
      const path = resolve("src/templates/feedback_submitted.hbs");
      this.addWatchFile(path);
      this.emitFile({
        type: "asset",
        fileName: "templates/feedback_submitted.hbs",
        source: await readFile(path, "utf8"),
      });
    },
  }],
} satisfies NonNullable<FastifyToabConfigOptions["rolldown"]>;

export default defineConfig({
  rolldown,
  env: Type.Object({
    AUTH_RESOURCE_ACCESS_CLIENT_ID: Type.Optional(Type.String()),
    DATABASE_URL: Type.String(),
    SMTP_URL: Type.Optional(Type.String({ minLength: 1 })),
    MAIL_FROM: Type.Optional(Type.String({ minLength: 1 })),
    FEEDBACK_MAIL_TO: Type.Optional(Type.String({ minLength: 1 })),
    TILES_URL: Type.String({ minLength: 1 }),
    TERRAIN_URL: Type.String({ minLength: 1 }),
    ADDRESS_DATABASE_URL: Type.String({ minLength: 1 }),
    // Web analytics stays off unless both values are set for this environment.
    MATOMO_URL: Type.Optional(Type.String()),
    MATOMO_SITE_ID: Type.Optional(Type.String()),
    APP_BASE_URL: Type.String(),
    PUBLIC_CLIENT_BASE_URL: Type.String(),
    ADMIN_CLIENT_BASE_URL: Type.String(),
    PORT: Type.Optional(Type.String()),
    NODE_ENV: Type.Optional(Type.String()),
    // Comma-separated origins allowed in addition to the two client apps.
    AUTH_CORS_ADDITIONAL_ORIGINS: Type.Optional(Type.String()),
    // Required unless AUTH_INSECURE_DEV_DECODE is set. resolveAuthConfig() in
    // auth.service.ts enforces them (and HTTPS) when the auth service starts.
    KEYCLOAK_JWKS_URI: Type.Optional(Type.String()),
    KEYCLOAK_ISSUER: Type.Optional(Type.String()),
    AUTH_EXPECTED_AUDIENCE: Type.Optional(Type.String()),
    // Local development only; rejected at startup outside development/test.
    AUTH_INSECURE_DEV_DECODE: Type.Optional(Type.String()),
    // Days until a new public deletion token stops allowing downloads (1 to
    // 9999, which keeps the expiry a valid Date); unset (default) means no
    // expiry. Expires only the link, never the data: enable it only together
    // with a retention-deletion process and the same period, see
    // issueDeletionToken in submissions.service.ts and the backend README.
    SUBMISSION_DELETION_TOKEN_TTL_DAYS: Type.Optional(Type.String({ pattern: "^[1-9][0-9]{0,3}$" })),
  }),
  onRouteError: routeErrorHandler,
  // onReady runs after fastify.ready(), when error handlers are locked. API
  // routes are registered after onPreStart and use this handler; plugin-owned
  // routes registered before it (/health, CORS preflight) keep their own
  // documented error schemas.
  onPreStart: async (fastify) => {
    fastify.setErrorHandler(requestErrorHandler);
    // Fail at startup instead of on the first cross-origin request.
    allowedCorsOrigins();
  },
  onReady: async (fastify) => {
    if (!fastify.hasDecorator("swagger")) return;

    // fastify-toab documents handlers without an output body as 204. Public
    // feedback creation intentionally has no body but uses 201 instead.
    const document = fastify.swagger() as {
      paths?: Record<
        string,
        { post?: { responses?: Record<string, unknown> } }
      >;
    };
    const responses = document.paths?.["/api/public/feedback"]?.post?.responses;
    if (!responses) return;

    delete responses["204"];
    responses["201"] = { description: "Feedback created" };
  },
  fastify: () => ({
    // Disabled in development by fastify-toab; elsewhere never reflect Origin.
    cors: {
      origin: createCorsOrigin(),
      // fastify-toab's default list lacks X-Access-Token, which auth.service.ts accepts.
      allowedHeaders: ["Content-Type", "Authorization", "X-Access-Token", "X-Requested-With"],
    },
    underPressure: {
      exposeStatusRoute: "/health",
    },
    swagger: {
      openapi: {
        openapi: "3.1.0",
      },
    },
  }),
});
