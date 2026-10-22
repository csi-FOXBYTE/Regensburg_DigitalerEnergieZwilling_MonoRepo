# SBOM generation and local openCode audits

GitHub releases generate inventories without evaluating license compliance.
The expensive ScanCode audit is an explicit local step before publishing a release
to openCode. The target is the [openCode maintainer requirements](https://opencode.de/de/wissen/rechtssichere-nutzung/anforderungen-an-inhalte).

## Normal GitHub releases

Push and pull request CI runs workspace checks without generating or uploading
SBOMs or building container images. Changed release images generate
fresh dependency inventories and embed them at `/usr/share/regensburg/SBOM.cdx.json`.
This includes configured build dependencies and dependencies bundled into static
assets. Release publication generates new source/application snapshots and uses
Syft to inventory the exact final runtime/OS images, including reused images.

Snapshots and their source/image/hash receipt are committed under `release/sboms/`
at the tag and uploaded as Actions artifacts. Missing or altered inventories stop
publication. License findings do not gate GitHub releases. Normal image builds and
workflows never install or invoke ScanCode. Generating an inventory does not establish
openCode compliance. Existing own licenses and notices remain in the artifacts.

The core workflow generates a fresh SBOM for the exact package name/version,
packs it into the tarball and publishes those exact prepared bytes when requested.

## Run the full audit before publishing to openCode

Use a complete clone containing the selected release's source history. The release's
`release/manifest.json` selects exact image digests and original image source commits.
The audit does not change Git refs, image tags or remote repositories.

### Dedicated tools container (Linux host)

From the repository root, build the local tools image once. It supplies Node 24.22.1,
pnpm 11.22.0, ScanCode 32.5.0, Syft 1.54.1, Python 3.11 and the SPDX validator.
Python dependencies are pinned in `requirements.txt`.

```sh
docker build -f scripts/compliance/Dockerfile -t regensburg-opencode-audit:local .
```

Log in to GHCR on the host if the selected images are private. Mount the repository
at the same absolute path, and run as your user with access to the Docker socket:

```sh
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --group-add "$(stat -c '%g' /var/run/docker.sock)" \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$PWD:$PWD" \
  --volume "${DOCKER_CONFIG:-$HOME/.docker}:/docker-config:ro" \
  --env DOCKER_CONFIG=/docker-config \
  --workdir "$PWD" \
  regensburg-opencode-audit:local \
  scripts/compliance/audit.mjs opencode \
  .local/opencode-audit-v0.1.0 release/manifest.json
```

Use an output directory that does not exist; choose a new name for every attempt.
Alternatively, with the same tool versions already installed, run directly:

```sh
node scripts/compliance/audit.mjs opencode \
  .local/opencode-audit-v0.1.0 release/manifest.json
```

Set `SCANCODE` and `SPDX_PYTHON` to the scanner and Python executables if needed.
`COMPLIANCE_PROCESSES` defaults to one worker; more workers require more memory.
The full audit can take tens of minutes per application.

### What it checks and produces

The audit scans the pinned source, including docs/media, and exports each selected
container without executing its application entrypoint. For each application it
extracts the image's original source into `.local/`, installs the frozen dependency
graph and scans installed package contents. This exposes embedded licenses in
bundled dependencies whose manifests are absent from the final static image.
Package contents are reconstructed from the lockfile; externally fetched build
inputs and toolchain differences still require maintainer review. Syft inventories
shipped runtimes and OS packages; ScanCode examines the exported container files.

Outputs include:

- `SPDX_source.spdx.json` and `SPDX_<application>.spdx.json`;
- `compliance-report.json` with findings and evidence hashes;
- `compliance-evidence.json` with original detected texts and copyrights;
- `THIRD_PARTY_NOTICES.txt`, `receipt.json` and `summary.md`;
- raw scanner reports under `work/` for investigating individual findings.

The SPDX project's validator checks the generated documents. Nonstandard detector
identifiers use LicenseRef entries; raw values and matched texts remain available.
This formatting cannot resolve findings. Exit code zero means the configured audit
policy passed. A nonzero exit or incomplete run requires investigation before an
openCode publication. The tool does not publish, sanitize or provide legal certification.

Review findings, fulfill distribution obligations and include the successful SPDX
files/notices in the repository sent to openCode. Retain the required
`SPDX_<artifact>.spdx.json` naming. Sanitization and transfer are future pipeline
stages. Changes to distributed contents require checking the final payload again;
a scan of an earlier GitHub release cannot validate later edits.

## Policy and review decisions

`policy.json` is a conservative project policy, not the complete openCode license
list. Permissive declarations require supporting scan evidence. Copyleft
compatibility, conflicting declarations, unsupported identifiers, missing texts,
missing inputs and scanner errors require investigation. Font/media eligibility
may require a documented policy decision. Do not amend policy simply to clear a
finding. No copyright is invented when a completed scan detects none.

`reviews.json` intentionally starts empty. Scanners cannot establish ownership
or every distribution obligation, so the repository requires a maintainer rights
review. Add records to its `components` array using the report's key and hash:

```json
{
  "key": "regensburg-source",
  "evidenceHash": "sha256:<exact hash from the report>",
  "licenseConcluded": "LGPL-3.0-or-later",
  "reviewer": "responsible maintainer",
  "rationale": "document rights evidence, compatibility and fulfilled obligations",
  "obligationsSatisfied": true,
  "sourceRightsConfirmed": true
}
```

Third-party reviews bind exact evidence. First-party compatibility reviews bind
licensing observations; source rights reviews cover source contents and exclude
the decision file itself. `falsePositives` can map a detector identifier to a
specific explanation. Reviews cannot authorize ineligible licenses or scanner
errors. Run a fresh audit after recording a decision.

## Optional independent core audit

`pnpm compliance:core` retains the full local core audit. It builds/scans a candidate,
adds SPDX/notices to the final tarball and audits its final bytes. It requires the
same scanner environment. The normal core workflow uses
`scripts/prepare-core-package.mjs` and performs no compliance scan.

With the container setup, use the same mounts above and
`scripts/compliance/prepare-core.mjs` as the command. Transient files belong in
`.local/`; move existing audit directories aside before rerunning.
