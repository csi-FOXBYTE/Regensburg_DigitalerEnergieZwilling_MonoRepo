# Digitaler Energie Zwilling — Admin Frontend

Vite + React SPA for the admin interface of the Digital Energy Twin platform.

## Municipality theming

The municipality-wide visual configuration lives in
[`src/config/theme.ts`](src/config/theme.ts). Its `municipalityDesign` object is
the customization entry point for brand and semantic colors, typography,
corner shapes, shared layout dimensions, and shadows. MUI component defaults
are derived from those values in the same file, so application components
should use palette roles and theme values instead of city-specific literals.

## Getting started

```bash
pnpm install
cp .env.development.local.example .env.development.local
# fill in .env.development.local (see Dev auth section below)
pnpm dev
```

## Tests

The unit tests use the built-in Node.js test runner and require no additional
test framework. Run the complete suite with:

```bash
pnpm test
```

Test files live under `tests/` and use the `*.test.ts` suffix.

## Dev auth (temporary)

Real OIDC/Keycloak login is not yet wired. For local development, a JWT generated
by the backend's `pnpm jwt:dev` is read from `VITE_DEV_ACCESS_TOKEN` and attached
as `Authorization: Bearer <token>` to every request to the backend.

**This mechanism is completely disabled in production builds.** `import.meta.env.DEV`
is a compile-time literal — Rollup dead-code-eliminates all dev-auth paths during
`vite build`. You can verify with:

```bash
pnpm build && grep -r 'VITE_DEV_ACCESS_TOKEN' dist/   # must return nothing
```

### Setup

1. Copy `.env.development.local.example` to `.env.development.local` (already in `.gitignore`).
2. Generate a token in the backend repo:
   ```bash
   pnpm jwt:dev --ttl 2592000 --output raw
   ```
   The 30-day TTL avoids frequent regeneration during local development.
3. Paste the token and set the API base URL in `.env.development.local`:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   VITE_DEV_ACCESS_TOKEN=<paste token here>
   ```
4. Run `pnpm dev`.

Removing or clearing `VITE_DEV_ACCESS_TOKEN` means no `Authorization` header is sent
— requests to `/api/admin/*` will return 401, which is the correct failure mode.

## Generating the API client

The typed API client (`src/api/api.gen.ts`) is generated from the backend's OpenAPI
spec via [orval](https://orval.dev). The backend must be running (APISIX on port 5000):

```bash
pnpm gen:api
```

All generated hooks route through `src/api/client.ts`, which handles base URL
resolution and dev-auth header injection. Do not hand-edit `api.gen.ts`.

## Environment variables

| Variable | Required in dev | Effect in prod |
|---|---|---|
| `VITE_API_BASE_URL` | Yes (`http://localhost:5000`) | Leave empty — requests are same-origin via APISIX |
| `VITE_DEV_ACCESS_TOKEN` | Yes (JWT from `pnpm jwt:dev`) | None — code path is dead-code-eliminated |

## Software bill of materials

The checked-in `SBOM.cdx.json` is a CycloneDX 1.6 inventory and `SBOM.csv`
contains the same components in a review-friendly format. The inventory includes
application runtime dependencies, packages needed by the production build, and
the Node and NGINX container software declared by the Dockerfile. Test, lint,
code-generation, and local-development-only packages are excluded.

Regenerate both files with pnpm 11 or newer and the installed dependency tree:

```bash
pnpm run sbom
```

Keep `sbom.config.json` synchronized with build-tool imports and the Dockerfile.
For every Git tag, the image workflow regenerates the CycloneDX file with the
tag as its component version and publishes it as a signed SBOM attestation for
the exact GHCR image digest.
