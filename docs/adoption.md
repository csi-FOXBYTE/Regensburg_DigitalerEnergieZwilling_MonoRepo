# Review and production adoption

This repository began as a snapshot import. The seven original
checkouts and their Git metadata remain outside its mutation scope. Existing dirty
SBOM files were excluded and regenerated for this layout. Full revisions and
exclusions are in `import-provenance.json`. Original per-package legal notices are
preserved. The internal FHHVR release tooling reference revision is recorded in
root NOTICE; no Azure, customer-source export, deployment, or business code was imported.

## Migration changes beyond paths

- One Node 24.21.0 / pnpm 11.22.0 toolchain, one reconciled root lockfile, explicit
  native build approvals, and three workspace links to the existing core API.
- Source lockfile resolutions were merged, with an npm-registry integrity hash
  added for the existing fastify-toab 0.2.0-rc.4 tarball. React type packages are
  unified at 19.2.17/19.2.3 to avoid incompatible duplicate JSX types. Existing
  application runtime ranges and core peer contract remain unchanged.
- Admin route generation is explicit. Its two pre-existing type errors were fixed:
  subsidies are sent as the backend's `string[]` of JSON entries, and nullable
  `usedConfig` is accessed safely. No business schema changes were made.
- Root development supervises apps and rebuilds local core without publication.
  Content-hash polling avoids bind-mount event loops; backend restarts after rebuild.
- SBOM generators use package identities and explicit workspace filtering instead
  of cwd names/the first workspace list result. Native pnpm executables are invoked
  directly. The backend uses pnpm's full resolved graph to avoid truncated repeated
  dependency branches in its former traversal.
- Runtime release configuration is separate from built package/API metadata.

## Addon contract (proposed, not applied to the separate addon)

1. Let an operator select one exact completed GitHub release on this repo. Default
   deployment selection excludes drafts and prereleases; prerelease use requires
   explicit opt-in. Do not independently resolve `dev` or `latest` for any image.
2. Fetch that release JSON and `release/manifest.json` from its exact `vX.Y.Z` tag.
   Verify their equality and the source/tag ancestry. Use:
   `node scripts/deploy/select-release.mjs release.json manifest.json --allow-prerelease`
   for a prerelease. Omit the opt-in for a stable release.
3. Persist the returned manifest/selection in the addon preparation PR. Keep
   application version, artifact build IDs, sources, immutable digests and SBOM
   hashes. Fetch each SBOM from `image@sha256:...`, verify its hash and its own
   build/source metadata using `verifyImage`; reused artifacts need not match the
   new app version. A tag or SBOM version mismatch must fail preparation.
4. Generate all Compose/Kubernetes image fields as `repository@sha256:...`, using
   `selection.images.frontend`, `.adminfrontend` and `.backend`. Releases up to
   v1.8.0 may also contain `.matomo`; after v1.8.0 the add-on builds and pins the
   Matomo image itself, see its [images/matomo](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_digital-energy-twin_addon/tree/main/images/matomo). Set both static
   frontends' `APP_VERSION=selection.appVersion` at runtime. API paths continue to
   route through the deployment gateway; nginx itself is only a static server.
5. Serialize addon preparation for its target environment. Before merge, revalidate
   the exact reviewed selection, completed release, tag and all evidence. Never
   change the selection to newer moving tags after review. Fail missing artifacts.
6. Automatically triggered delayed preparations should not downgrade a newer
   adopted version; explicit operator-selected rollback may deploy an older
   complete selection. Keep the old manifest for rollback.

The fixture test verifies all immutable image references and rejects draft,
non-opted-in prerelease and journal/tag mismatches. Live addon integration remains
a separate reviewed change in its own repository.

## Independent core publication

No package dependency on the core was found in the separate offline enrichment or
Airflow projects at import. Nevertheless the public package exports and version
are retained. `pnpm core:pack` builds/tests an independently consumable tarball.
The `Independent core package` workflow always uploads that tarball. Its optional
publication uses ONLY `@csi-foxbyte/regensburg-web-energy-core-test`, with
unique `-test.<run>.<attempt>` version and `test` dist-tag. It cannot
publish over the existing production core package.

To adopt core publication here, explicitly transfer package Actions write access,
confirm external consumers, decide package release ownership, and review a manual
workflow targeting a bumped independent core version. Do not tie publication to
every web application release or overwrite the existing 0.20.2 package.

## Production adoption checklist

- Review imported source revisions, legal provenance and the small admin fixes.
- Resolve the prior SBOM licensing/coverage audit and confirm public redistribution
  rights for reference-derived release scripts.
- Review GHCR repository visibility, access inheritance, retention and
  immutable-digest rollback policy for the current image names.
- Decide branch protection and who may dispatch/recover releases. Current metadata
  publication assumes permitted atomic pushes to main. Adapt this for protected main.
- Provide reviewed production environment values, Keycloak clients/roles, gateway
  routes/CORS and data-resource endpoints. No production credentials were imported.
- Test real map resources, external authentication and browser accessibility flows.
- Make the separate addon changes above, review the selected release, then stage
  the digest-pinned images together. Back up data and run only existing
  required migrations under the normal deployment process.
- Verify health, login, admin/public operations and runtime versions in staging.
- Assign core publication ownership; preserve external API/package compatibility.
- Only after rollout approval retire/redirect source repositories and their old
  CI jobs. This repository does not perform retirement or production deployment.
