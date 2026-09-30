# Prototype verification

Verification is in progress; this file is updated with final commands and results
before delivery. Source snapshots and known original SBOM changes are recorded in
`import-provenance.json`. Local transient logs are in `.local/logs/` (ignored).

Completed so far:

- Node 24.21.0 / pnpm 11.22.0 workspace installation, no private token needed.
- All four package type checks pass after explicit code generation.
- Existing tests: core 255, frontend 46, admin 12, backend 25; all pass.
- Release/deployment contracts: 35 tests pass using mocked remote operations.
- All three application production builds pass.
- Four scoped SBOMs generated with local core version 0.20.2 in all three apps.
- Existing eight migrations applied to the fresh `rg-web-prototype` database.
- GitHub workflow syntax checked with actionlint 1.7.7.

Pending: final image builds, isolated HTTP/watch smoke, clean frozen install,
remote CI and acceptance audit. No claim of production adoption or live release
verification is made by these local checks.
