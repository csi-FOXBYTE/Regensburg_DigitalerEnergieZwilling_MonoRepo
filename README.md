# Regensburg Digitaler EnergieZwilling — web workspace

This repository contains the public frontend, administration frontend, backend,
and energy calculation core for the Regensburg digital energy twin. The three
applications share the core directly through the pnpm workspace. The core retains
its own package name and version because other consumers may depend on its API.

| Path | Purpose | Local address |
| --- | --- | --- |
| `apps/frontend` | Public Astro application | http://localhost:4321/en/ |
| `apps/adminfrontend` | Administration Vite application | http://localhost:5173/ |
| `apps/backend` | API, data access and migrations | http://localhost:5001/health |
| `packages/energy-core` | Shared calculation library and CLI | Workspace dependency |
| `.devcontainer` | Node, PostgreSQL, Redis and APISIX development services, optional Matomo | http://localhost:5000/docs |

The addon, offline enrichment and Airflow projects have separate repositories.
Their source history and this workspace's import provenance are recorded in
[docs/import-provenance.json](docs/import-provenance.json).

## Develop locally

Use VS Code **Reopen in Container** from this directory. The devcontainer uses
Node 24.22.1 and pnpm 11.22.0 as the `node` user. It runs a local PostgreSQL
database, Redis and APISIX. Before starting it, copy `.env.example` to
`.env` in the repository root and replace the map resource URLs. The `.env` file
is ignored by Git. Alternatively, start its services on the host:

```sh
docker compose -f .devcontainer/compose.yml up -d --build
```

Then, inside the devcontainer:

```sh
pnpm install --frozen-lockfile
pnpm prepare:workspace
pnpm --filter ./apps/backend exec zenstack migrate deploy --schema src/zenstack/schema.zmodel
pnpm dev
```

VS Code runs the install and workspace preparation automatically when it creates
the container. Run the migration command once for a new database, and again when
new migrations are added. The `regensburg-web` Compose project uses a fresh
`postgres_data` volume; the earlier development volume remains separate. The
database credentials in Compose are only for local development.

`pnpm dev` starts all three applications, watches the core and restarts the backend
after a successful core rebuild. For an individual application use `pnpm dev:frontend`,
`pnpm dev:admin` or `pnpm dev:backend` after `pnpm prepare:workspace`. `pnpm dev:core`
runs the core watcher.

A local Matomo for the web analytics is optional and not started by default.
To use it, start it on the host:

```sh
docker compose -f .devcontainer/compose.yml --profile matomo up -d --build matomo matomo-setup
```

Always name the services: the same file defines the devcontainer, so a bare
`up --build` recreates it and `down` stops it (`down -v` also deletes the dev
database).

The first start installs and configures it (the `matomo-setup` service, a few
minutes for the browser image); `docker compose -f .devcontainer/compose.yml
logs matomo-setup` shows the progress. Then set
`MATOMO_URL=http://localhost:8091/matomo.php` and `MATOMO_SITE_ID=1` in `.env`
and rebuild the devcontainer so the backend picks them up. The public frontend
then tracks to http://localhost:8091/ (`admin` / `admin-Passw0rd!`) after
**Alle erlauben** in the consent dialog. The instance enforces the CNIL
compliance policy, which disables the visits log; events appear in the
aggregated reports under **Behaviour > Events**. Use the same command to start
Matomo again later. The
[Matomo test setup](apps/frontend/tests/matomo/README.md) is a separate,
throwaway instance for automated checks.

The map and address-resource URLs come from the root `.env` file. To use the
admin UI with the local API,
generate a development token inside the container:

```sh
pnpm --filter ./apps/backend jwt:dev --ttl 3600 --output raw
```

Copy `apps/adminfrontend/.env.development.local.example` to the ignored
`apps/adminfrontend/.env.development.local`, and put the token in
`VITE_DEV_ACCESS_TOKEN`. See the [admin setup](apps/adminfrontend/README.md) for
the other local settings. These local credentials and tokens are not deployment
configuration.

## Check and build

Run these commands inside the devcontainer:

```sh
pnpm check           # generate prerequisites, type-check and run tests
pnpm build           # build the core and all three applications
pnpm test:release    # exercise release and deployment selection locally
pnpm gen:api         # regenerate the admin API client from the running APISIX API
pnpm core:pack       # pack the independently versioned core into .local/packages
pnpm run sbom        # generate scoped CycloneDX and CSV inventories
```

`pnpm run sbom` uses the workspace script; `pnpm sbom` invokes pnpm's built-in
command. GitHub CI performs a frozen install and `pnpm check`. Local verification
history and remaining integration checks are in [docs/verification.md](docs/verification.md).

To build application images from the repository root:

```sh
docker buildx build --load -f apps/frontend/Dockerfile -t regensburg-web-frontend:validation .
docker buildx build --load -f apps/adminfrontend/Dockerfile -t regensburg-web-adminfrontend:validation .
docker buildx build --load -f apps/backend/Dockerfile -t regensburg-web-backend:validation .
```

## Releases and deployment

The manually dispatched [application release workflow](scripts/release/README.md)
selects one application version and immutable digests for all three images. Current
policy marks releases as prereleases. New images use
`ghcr.io/csi-foxbyte/regensburg-web-{frontend,adminfrontend,backend}`. The existing
v0.1.0 manifest retains its original image repositories and digests so that
release recovery and deployment can still read that published selection. A new
release builds fresh images in the new repositories. When the current manifest is
v0.1.0, the next changed release is **v1.7.3**; later releases use the selected
patch, minor or major increment.

The backend does not apply database migrations at startup. Deployment must run
the required migrations through its normal process. Both static frontends read
`APP_VERSION` at runtime; `/release.json` exposes the selected application version.
The core's npm version remains independent of application versions.

The [addon selection contract](docs/adoption.md) explains how a separate deployment
project can consume an exact completed release. Prerelease selection requires
`--allow-prerelease`. The optional [core package workflow](.github/workflows/core-package.yml)
publishes only a distinct test package, `@csi-foxbyte/regensburg-web-energy-core-test`,
with a run-specific `-test.<run>.<attempt>` version. Publication under the core's
existing package name needs a separate ownership and release decision.

Release tags include CycloneDX source and runtime inventories. Before any openCode
publication, run and review the [full local compliance audit](scripts/compliance/README.md);
it covers the exact source, dependencies and selected images. Legal provenance and
redistribution considerations are in [NOTICE](NOTICE).
