# Workspace verification

# Local verification record

Source snapshots and known original SBOM changes are recorded in
`import-provenance.json`. Transient logs are kept in the ignored `.local/logs/`.

The initial workspace import was checked with:

- Node 24.21.0 / pnpm 11.22.0 workspace installation, no private token needed.
- All four package type checks pass after explicit code generation.
- Existing tests: core 255, frontend 46, admin 12, backend 25; all pass.
- Release/deployment contracts: 35 tests pass using mocked remote operations.
- All three application production builds pass.
- Four scoped SBOMs generated with local core version 0.20.2 in all three apps.
- Existing eight migrations applied to the initial development database. The
  renamed Compose project now starts with a fresh database and needs migrations.
- GitHub workflow syntax checked with actionlint 1.7.7.

The release-name migration was checked with `pnpm test:release` and `pnpm check`.
Final image builds, isolated HTTP/watch smoke, a clean frozen install, remote CI
and the acceptance audit remain separate checks. Local checks do not establish
production readiness or verify a live release.
