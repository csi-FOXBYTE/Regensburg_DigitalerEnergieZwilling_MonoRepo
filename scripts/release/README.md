# Application release model

`Release Regensburg web` is manually dispatched on `main`, selecting patch,
minor or major. The first application version was **0.1.0**. Current releases
are marked **prerelease** by `config.json` and new images use the
`regensburg-web-*` GHCR repositories. The published v0.1.0 manifest retains its
original repositories and immutable digests. The first release after the name
change rebuilds all three images in the new repositories. When the current
manifest is v0.1.0, the next changed release is pinned to **v1.7.3** regardless
of the selected bump. Subsequent releases use the selected bump normally.

The independent identities are:

- application semantic version: the coherent selection in `release/manifest.json`;
- each image's `build-<run_id>-<attempt>` identity and original source SHA;
- the core's npm/API version, currently 0.20.2, unchanged by app release selection.

The schema-2 manifest binds frontend, adminfrontend, backend and matomo to repository,
immutable digest, build ID, artifact source, input fingerprint, platform, resolved
Node and runtime base digests, and a CycloneDX SBOM path/hash/build/source.
The SBOM lives at `/usr/share/regensburg/SBOM.cdx.json` inside the immutable image.
BuildKit also emits image SBOM and provenance attestations. Package inventory
includes dependencies bundled into static apps; it is not limited to the final
nginx filesystem. The embedded SBOM is scoped application/build evidence; BuildKit
SBOMs additionally inventory the final OS. Before publication, `generate-sboms.mjs`
creates fresh CycloneDX snapshots of the selected source and application inputs,
plus Syft runtime/OS inventories for all selected images. Their identity/hash receipt
is stored in the publication journal and the inventories are committed under
`release/sboms/` at the tag. This checks inventory integrity, not license eligibility.
GitHub CI and releases run no ScanCode audit. The [full local audit](../compliance/README.md)
is an explicit step before a later openCode publication.

## Matomo image

`matomo` is no pnpm app. Its build inputs are only `images/matomo/`, without
`sso-test/` and Markdown, and its Docker context is that directory (`context`
and `dockerfile` in `config.json`). A Node stage runs `images/matomo/sbom.mjs`
for the embedded SBOM: the Matomo base image, LoginOIDC with its checksum and
NoPasswordReset. Node is therefore its build base and Matomo its runtime base.
Manifests up to v1.7.3 have no `matomo` and stay valid; the next release builds
it, and every later release selects all four images.

## Reuse and freshness

A completed tagged release is the baseline, never a workflow cache. No changed
inputs means no release and no version bump. A reused artifact keeps its original
build, source and SBOM. The planner verifies its continued availability and SBOM
integrity. `isBuildInput` is shared between fingerprinting and Git context export.
Core source, all workspace manifests, lockfile, scripts, patches, own application
files, Dockerfile and release policy invalidate the affected images. File deletion,
rename and executable mode count. Both base digests, platform and `refreshEpoch`
also count. Increment `refreshEpoch` to refresh externally changing OS/build inputs.
Generated files, environment files, dependency/cache directories and the release
manifest are never build inputs. Update the allowlist if a new shared input is added.

## Publication and recovery

Publication is serialized with cancel-in-progress disabled. The dispatch SHA is
pinned. If `main` advances before publication, the run fails without app-version
publication. A draft GitHub release stores the exact selection before retagging.
Other runs stop while this journal exists. Rerun the **original workflow run** to
recover. Recovery rechecks image labels, digests and SBOM bytes, never moving tags.
Matching existing version tags may be reused; conflicting ones fail. The release
metadata commit and Git tag are pushed atomically without force. If main advances
after publication has started, publication stops for maintainer investigation so
the tag cannot include source differing from the SBOM snapshot. Completion of an already completed run
is a no-op.

Build/check failures prevent completion; unique build tags may remain. Do not edit
or delete a draft journal to bypass recovery. Retain images, manifests and SBOMs
for the supported rollback lifetime. App-version tags have one serialized writer;
manually racing registry mutations are outside this workflow's guarantees.

The target repository uses its automatic GITHUB_TOKEN for normal CI/release
operations. An organization policy blocking package creation or branch writes is
reported as a failed check; it must not silently substitute production packages.

## Local checks

`pnpm test:release` simulates GitHub, registry and Git operations. It tests per-app
and shared invalidation, unchanged reuse, base/policy changes, stale source,
conflicts, missing images/SBOMs and interruptions before/after Git publication.
It does not publish. Local Docker builds validate execution; a real Actions run
is separately recorded in docs/verification.md.

No fake successful manifest is committed. Example manifests exist only in clearly
marked test fixtures. The addon consumes the completed release journal and exact
tagged manifest through `scripts/deploy/select-release.mjs`.
