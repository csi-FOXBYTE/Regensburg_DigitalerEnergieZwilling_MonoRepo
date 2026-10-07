# Regensburg web monorepo prototype

One workspace for the public Astro frontend, admin Vite frontend, backend and
energy calculation core. This is a review prototype, not a production migration.
Addon, offline enrichment and Airflow remain in their original repositories.

## Start development

Open this directory in VS Code and choose **Reopen in Container**. One container
runs Node **24.21.0** and pnpm **11.22.0** as user `node`. The checked-in Compose
project is `rg-web-prototype`; it has its own network and PostgreSQL volume.

```sh
# Host (or let VS Code create the services)
docker compose -f .devcontainer/compose.yml up -d --build
# Inside the devcontainer
pnpm install --frozen-lockfile
pnpm prepare:workspace
pnpm dev
```

| Service | Host URL |
| --- | --- |
| Public frontend | http://localhost:14321/en/ |
| Admin frontend | http://localhost:15173/ |
| APISIX / API / docs | http://localhost:15000/docs |
| Direct backend | http://localhost:15001/health |

The core resolves through `workspace:*` in every app. No GitHub package token is
needed to install it. All other current dependencies resolve from npmjs.org.
`pnpm dev` builds prerequisites, runs all apps, watches core content, and restarts
the backend when a core rebuild succeeds. Vite/Astro see the workspace build
through their normal file watching. `pnpm dev:core`, `dev:frontend`, `dev:admin`
and `dev:backend` can also run individually after `prepare:workspace`.

Before the first backend request needing database tables, apply existing
migrations **inside this container**, whose DATABASE_URL targets the fresh
prototype database:

```sh
pnpm --filter ./apps/backend exec zenstack migrate deploy --schema src/zenstack/schema.zmodel
```

No existing database or external network is used. Map data URLs default to
`example.invalid`; configure real resources explicitly to test tiles, terrain and
address search. No source `.env` values were imported. APISIX retains the existing
local JWT route protection; its development key is public test configuration.
Generate a development token with `pnpm --filter ./apps/backend jwt:dev --ttl 3600
--output raw` and set `VITE_DEV_ACCESS_TOKEN` only in the admin's ignored
`.env.development.local`. Never use the prototype credentials in production.

## Root commands

```sh
pnpm check           # generate, type-check, 338 existing tests, release contract tests
pnpm build           # core first, then all three production application builds
pnpm run sbom        # scoped CycloneDX + CSV in each package (run is required)
pnpm gen:api         # admin API client from the running prototype APISIX /docs/json
pnpm core:pack       # independently versioned core tarball in .local/packages
pnpm test:release    # mocks only: no registry/GitHub writes
```

`pnpm sbom` without `run` invokes pnpm's built-in command, not the workspace script.
Application checks explicitly generate ZenStack, fastify-toab registries and the
admin route tree. Core exports are not rewritten by a build. The core CLI can
also be run directly after building:
`node packages/energy-core/dist/bin/generate-det-building-energy-profile.js --help`.

Build separate production images from the repository root:

```sh
docker buildx build --load -f apps/frontend/Dockerfile -t regensburg-web-prototype-frontend:validation .
docker buildx build --load -f apps/adminfrontend/Dockerfile -t regensburg-web-prototype-adminfrontend:validation .
docker buildx build --load -f apps/backend/Dockerfile -t regensburg-web-prototype-backend:validation .
```

Release CI exports only fingerprinted Git inputs and pins both build and runtime
base digests. The backend retains ZenStack schema/migrations for deployment;
startup does not migrate automatically. Frontend/admin images serve static
content as UID 101 and write only `/tmp/regensburg-release.json` for release
configuration. Set `APP_VERSION` at deployment time on both frontends; `/release.json`
is not cached. Package and core API versions remain separately displayed.

Read [release behavior](scripts/release/README.md), [addon contract and adoption](docs/adoption.md),
[source provenance](docs/import-provenance.json), and [verification results](docs/verification.md).

## SBOMs and openCode publication

CI and GitHub releases generate fresh SBOMs without running the expensive license
scan. Release tags contain application dependency and container runtime/OS
CycloneDX inventories under `release/sboms/`. These inventories do not certify
license compliance, and license findings do not block GitHub releases.

Before publishing a release to openCode, run the retained full local audit:

```sh
# Requires the project toolchain, Docker, ScanCode and Syft; see setup below.
node scripts/compliance/audit.mjs opencode \
  .local/opencode-audit-v0.1.0 release/manifest.json
```

The [audit instructions](scripts/compliance/README.md#run-the-full-audit-before-publishing-to-opencode)
include a dedicated tools container, prerequisites, result interpretation and
review records. The audit scans the pinned source/dependency contents and exact
release images, and produces SPDX documents, original texts and notices. Resolve
its findings and include the results before an openCode publication. Sanitization
and transfer will be separate later stages; audit any changed final payload again.
