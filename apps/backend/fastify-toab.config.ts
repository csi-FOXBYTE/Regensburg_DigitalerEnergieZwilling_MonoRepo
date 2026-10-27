import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type FastifyToabConfigOptions } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";
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
    // Must use HTTPS; checked with the issuer and audience in auth.service.ts.
    KEYCLOAK_JWKS_URI: Type.String({ minLength: 1 }),
    KEYCLOAK_ISSUER: Type.String({ minLength: 1 }),
    AUTH_EXPECTED_AUDIENCE: Type.String({ minLength: 1 }),
    // Local development only; rejected at startup outside development/test.
    AUTH_INSECURE_DEV_DECODE: Type.Optional(Type.String({ pattern: "^true$" })),
  }),
  onRouteError: routeErrorHandler,
  // onReady runs after fastify.ready(), when error handlers are locked.
  onPreStart: async (fastify) => {
    fastify.setErrorHandler(requestErrorHandler);
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
