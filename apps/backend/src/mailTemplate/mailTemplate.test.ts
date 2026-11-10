import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import Fastify from "fastify";
import {
  ControllerRegistry,
  fastifyToab,
  type ServiceContainer,
  type ServiceRegistry,
} from "../toab/index.js";
import { AppError } from "../errors/app-error.js";
import { routeErrorHandler } from "../errors/route-error-handler.js";
import { getDefaultFeedbackTemplateSource } from "../mail/mail.templates.js";
import mailTemplateAdminController from "../mailTemplateAdmin/mailTemplateAdmin.controller.js";
import mailTemplateServiceDefinition, {
  renderFeedbackNotification,
} from "./mailTemplate.service.js";

const feedback = {
  id: "feedback-1",
  category: "feedback" as const,
  message: "Tolle Anwendung",
  emailAddress: null,
  createdAt: new Date("2026-10-19T12:32:00Z"),
};

type Row = { id: number; html: string; createdAt: Date; updatedAt: Date };

// Stands in for the single-row FeedbackMailTemplate table.
const createDb = (initial: Row | null = null) => {
  let row = initial;
  return {
    get row() {
      return row;
    },
    feedbackMailTemplate: {
      findUnique: mock.fn(async () => row),
      upsert: mock.fn(
        async ({ create, update }: { create: { id: number; html: string }; update: { html: string } }) => {
          const now = new Date("2026-11-10T10:00:00Z");
          row = row
            ? { ...row, ...update, updatedAt: now }
            : { ...create, createdAt: now, updatedAt: now };
          return row;
        },
      ),
      deleteMany: mock.fn(async () => {
        const count = row ? 1 : 0;
        row = null;
        return { count };
      }),
    },
  };
};

const storedRow = (html: string): Row => ({
  id: 1,
  html,
  createdAt: new Date("2026-11-01T08:00:00Z"),
  updatedAt: new Date("2026-11-02T08:00:00Z"),
});

describe("feedback notification rendering", () => {
  it("uses the bundled default when no template is stored", async () => {
    const db = createDb();
    const { html } = await renderFeedbackNotification(db as never, feedback);
    assert.match(html, /DIGITALER ENERGIEZWILLING/);
    assert.match(html, /Tolle Anwendung/);
  });

  it("uses the stored template", async () => {
    const db = createDb(storedRow("<p>Neu: {{message}}</p>"));
    const { html } = await renderFeedbackNotification(db as never, feedback);
    assert.equal(html, "<p>Neu: Tolle Anwendung</p>");
  });

  it("falls back to the default when the stored template is unusable", async () => {
    // Bypasses validation, e.g. a row edited directly in the database.
    const db = createDb(storedRow("<p>{{{message}}}</p>"));
    const { html } = await renderFeedbackNotification(db as never, feedback);
    assert.match(html, /DIGITALER ENERGIEZWILLING/);
  });

  it("falls back to the default when the template cannot be loaded", async () => {
    const db = createDb();
    db.feedbackMailTemplate.findUnique.mock.mockImplementation(async () => {
      throw new Error("connection lost");
    });
    const { html } = await renderFeedbackNotification(db as never, feedback);
    assert.match(html, /DIGITALER ENERGIEZWILLING/);
  });
});

const createTestApp = async (db: ReturnType<typeof createDb>) => {
  const authService = {
    verifyRequest: async (request: { headers: { authorization?: string } }) => {
      const role = request.headers.authorization?.replace(/^Bearer /, "");
      if (!role)
        throw new AppError({ status: "UNAUTHORIZED", code: 401, message: "Missing access token" });
      return { sub: "user-1", resource_access: { "digital-energy-twin": { roles: [role] } } };
    },
  };
  const services: ServiceContainer = {
    get: async <T>(name: string) => {
      if (name === "auth") return authService as T;
      if (name === "database") return db as T;
      if (name === "mailTemplate")
        return (await mailTemplateServiceDefinition.factory({ services } as never)) as T;
      throw new Error(`Unexpected service: ${name}`);
    },
  };
  const serviceRegistry = {
    initializeInstant: async () => undefined,
    resolve: () => services,
  } as unknown as ServiceRegistry;
  const controllerRegistry = new ControllerRegistry(serviceRegistry);
  controllerRegistry.register(mailTemplateAdminController);
  const app = Fastify();
  await app.register(fastifyToab, {
    getRegistries: async () => ({ controllerRegistry, serviceRegistry }),
    onRouteError: routeErrorHandler,
  });
  await app.ready();
  return app;
};

const url = "/api/admin/mail-templates/feedback";

describe("feedback mail template routes", () => {
  it("is limited to admins and maintainers", async (t) => {
    const app = await createTestApp(createDb());
    t.after(() => app.close());

    for (const [method, path, payload] of [
      ["GET", url, undefined],
      ["PUT", url, { html: "<p>{{message}}</p>" }],
      ["DELETE", url, undefined],
      ["POST", `${url}/preview`, { html: "<p>{{message}}</p>" }],
    ] as const) {
      const anonymous = await app.inject({ method, url: path, payload });
      assert.equal(anonymous.statusCode, 401, `${method} ${path} anonymous`);
      const manager = await app.inject({
        method, url: path, payload, headers: { authorization: "Bearer manager" },
      });
      assert.equal(manager.statusCode, 403, `${method} ${path} manager`);
      for (const role of ["admin", "maintainer"]) {
        const allowed = await app.inject({
          method, url: path, payload, headers: { authorization: `Bearer ${role}` },
        });
        assert.equal(allowed.statusCode, 200, `${method} ${path} ${role}`);
      }
    }
  });

  it("returns the default, saves a template and resets to the default", async (t) => {
    const db = createDb();
    const app = await createTestApp(db);
    t.after(() => app.close());
    const headers = { authorization: "Bearer maintainer" };
    const defaultHtml = await getDefaultFeedbackTemplateSource();

    const initial = await app.inject({ method: "GET", url, headers });
    assert.deepEqual(initial.json(), { html: defaultHtml, isDefault: true, updatedAt: null, defaultHtml });

    const saved = await app.inject({ method: "PUT", url, headers, payload: { html: "<p>{{message}}</p>" } });
    assert.equal(saved.statusCode, 200);
    assert.deepEqual(saved.json(), {
      html: "<p>{{message}}</p>",
      isDefault: false,
      updatedAt: "2026-11-10T10:00:00.000Z",
      defaultHtml,
    });
    assert.equal(db.row?.id, 1);

    const reset = await app.inject({ method: "DELETE", url, headers });
    assert.deepEqual(reset.json(), { html: defaultHtml, isDefault: true, updatedAt: null, defaultHtml });
    assert.equal(db.row, null);
  });

  it("rejects invalid templates without storing them", async (t) => {
    const db = createDb(storedRow("<p>alt</p>"));
    const app = await createTestApp(db);
    t.after(() => app.close());
    const headers = { authorization: "Bearer admin" };

    for (const html of ["<p>{{{message}}}</p>", "<p>{{#if message}}</p>", ""]) {
      const response = await app.inject({ method: "PUT", url, headers, payload: { html } });
      assert.equal(response.statusCode, 400, html);
    }
    assert.equal(db.row?.html, "<p>alt</p>");
    assert.equal(db.feedbackMailTemplate.upsert.mock.callCount(), 0);

    const preview = await app.inject({
      method: "POST", url: `${url}/preview`, headers, payload: { html: "{{> partial}}" },
    });
    assert.equal(preview.statusCode, 400);
    assert.match(preview.json().message, /Partials/);
  });

  it("previews an unsaved template with example feedback", async (t) => {
    const db = createDb();
    const app = await createTestApp(db);
    t.after(() => app.close());

    const response = await app.inject({
      method: "POST",
      url: `${url}/preview`,
      headers: { authorization: "Bearer admin" },
      payload: { html: "<p>{{category}}: {{message}}</p>" },
    });
    assert.equal(response.statusCode, 200);
    assert.match(response.json().html, /^<p>Verbesserungsvorschlag: \[Beispiel\] Hier steht später/);
    // The example contains a markup character, which stays escaped.
    assert.match(response.json().html, /Zeilenumbrüche &amp; Sonderzeichen/);

    // The default template shows the example Matomo session ID.
    const withDefault = await app.inject({
      method: "POST",
      url: `${url}/preview`,
      headers: { authorization: "Bearer admin" },
      payload: { html: await getDefaultFeedbackTemplateSource() },
    });
    assert.match(withDefault.json().html, /Matomo-Session-ID: beispiel-matomo-session-id/);
    assert.equal(db.feedbackMailTemplate.upsert.mock.callCount(), 0);
  });
});
