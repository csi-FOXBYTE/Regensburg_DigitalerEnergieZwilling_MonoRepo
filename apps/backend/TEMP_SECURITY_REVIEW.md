# Temporary security review

Review date: 2026-09-09. Status: source review only; no deployed vulnerability has been verified.

## Scope and evidence limits

- Reviewed backend code, relevant frontend flows, addon deployment templates, selected installed dependency code, and the Civitas Core Traefik template.
- No requests were sent to the application server. No SSH access, S3 testing, exploit execution, load testing, or database writes were performed.
- This temporary report is the only project file created by this review. No fixes have been applied.
- The project is under active development. Source, installed packages, image digests, and the deployed application may differ. A version mismatch alone is not a vulnerability. Recheck each finding against the intended release before treating it as a production issue.
- Backend HEAD when this report was prepared: `487e7d6` (`chore: updated core`). Addon HEAD: `3aabab9`. Civitas Core HEAD: `06090d97`. These three repositories had no changes reported by `git status --short` before this report was added.
- Installed framework inspected: `@csi-foxbyte/fastify-toab` at the backend's configured `0.2.0-rc.4` dependency. Installed dependency behavior is evidence about the local dependency tree, not proof of the deployed image's behavior.
- The addon is planned to move from APISIX to Traefik. APISIX-specific observations below are migration inputs, not assumptions about the future implementation.

Severity is provisional and describes potential impact under the stated prerequisites. “Source-backed” means the relevant code/configuration was found; it does not mean an exploit was executed.

## Additional findings

### SEC-04 — Cookie-authenticated submission actions lack an explicit CSRF check

**Priority:** High if the described browser/session path is deployed. **Status:** source-backed candidate; browser and gateway behavior unverified.

Evidence:

- `src/submissionsAdmin/submissionsAdmin.controller.ts:195` and `:219` define POST actions for accepting and declining a submission. Neither requires a body, CSRF token, or dedicated request header.
- Controller authentication verifies the access token supplied to the backend. No Origin, Referer, or Fetch Metadata validation was found in the reviewed backend middleware or framework startup path.
- `../Regensburg_DigitalerEnergieZwilling_digital-energy-twin_addon/tasks/digital-energy-twin.yml:846` configures the admin-host API route with session-capable OIDC authentication and access-token forwarding; its cookie uses `samesite: "None"` at line 867. The backend-host API route has equivalent settings around lines 1099–1120.
- The installed Fastify implementation accepts `text/plain` request bodies, while these actions declare no body schema. CORS configuration alone does not establish protection for simple cross-origin state-changing requests.

Potential impact: an external page could cause an authenticated operator's browser to request an accept/decline action that the operator did not intend. Preconditions include a known submission ID, a victim with the required role/assignment, a matching submission state, and a browser that sends the relevant session cookie. The gateway must also accept that session for the request. This is not an authentication bypass or proof that all browsers permit the request.

Recommendation: enforce CSRF protection for cookie-authenticated mutations, with server-side token and/or strict Origin/Fetch Metadata validation appropriate to the application's origins. Use an appropriate SameSite policy as an additional protection. Include this requirement explicitly in the Traefik authentication design; merely forwarding a verified access token does not establish user intent.

Remaining validation: inspect the actual authentication middleware chosen for Traefik and verify cookie-authenticated mutations using an approved isolated environment. No browser test has been run.

Reference: [MDN CSRF guidance](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF).

### SEC-05 — Download/deletion capability tokens are included in request logs

**Priority:** Medium. **Status:** source-backed logging exposure; actual production logs not inspected.

Evidence:

- `src/submissionsPublic/submissionsPublic.controller.ts:93`, `:110`, and `:153` put `deletionToken` in the request URL path for status, download, and deletion.
- The installed `node_modules/@csi-foxbyte/fastify-toab/dist/index.mjs`, function `startServer`, enables Fastify logging in production without a custom request serializer or request-logging suppression.
- `node_modules/fastify/lib/logger-pino.js:50` serializes `req.url`. `node_modules/fastify/lib/route.js:503` logs incoming requests.
- The reviewed application configuration and instrumentation do not redact these path segments.

Potential impact: anyone with access to those logs obtains a bearer capability that can download the submission's raw data and request deletion. The token is an access credential, not just a record identifier. The schema and lookup code do not give it a separate expiry.

Recommendation: redact capability tokens before request logging, including application and ingress logs. Review tracing and error pipelines for the same paths. Consider an exchange mechanism that keeps reusable capabilities out of routinely logged URLs. Response `Cache-Control: no-store` does not prevent request logging.

Remaining validation: check the logging configuration in the intended image and the retention/access controls of the deployed logging system without copying token values into reports. Check the new Traefik access-log design separately.

### SEC-06 — Backend rate limiting likely groups users by their gateway's address

**Priority:** Medium. **Status:** source-backed configuration concern; actual upstream connection addresses unverified.

Evidence:

- In `node_modules/@csi-foxbyte/fastify-toab/dist/helpers-BK1HqDTW.mjs`, `resolveConfig` enables the production limiter with a default of 100 requests per minute.
- In the same package's `dist/index.mjs`, `startServer` constructs Fastify with logging options but no `trustProxy` option.
- The installed `@fastify/rate-limit` default key generator is `req.ip`.
- `node_modules/fastify/lib/request.js:209` derives `ip` from `socket.remoteAddress` when proxy trust is not enabled.
- `fastify-toab.config.ts` does not replace the rate-limit key generator, and the addon routes traffic through a gateway to a ClusterIP backend service.

Potential impact: users sharing an upstream gateway connection address share the backend's request allowance. One user's traffic can cause unrelated users to receive HTTP 429 responses. Multiple gateway/backend replicas may distribute the effect rather than create one cluster-wide bucket; the actual network topology matters.

Recommendation: configure client identity using only explicitly trusted proxy hops, or enforce suitable per-client quotas at the ingress with a separate backend capacity limit. Do not blindly trust caller-supplied forwarded headers. If the framework cannot pass the required Fastify constructor options, address that integration explicitly.

Remaining validation: compare resolved client identities for independent clients in an approved environment and inspect the exact framework version used for release. Traefik migration does not automatically fix this application-side behavior.

### SEC-07 — Admin pagination leaves nested submission queries unbounded

**Priority:** Medium. **Status:** source-backed availability risk; no load test performed.

Evidence:

- `src/submissions/submissions.service.ts:189` limits the number of buildings returned, but the nested `submissions` include at line 194 has no `take` or field selection. It loads full submission records, including raw input and calculated JSON, before the handler reduces them to summary fields.
- A second query at line 206 reads one row per submission for those buildings and counts them in application memory.
- The public submit flow at lines 94–107 allows repeated submissions against a caller-supplied building ID; no per-building quota was found in that flow.

Potential impact: accumulated submissions for a building make an otherwise small admin page expensive in database work, memory, response size, and browser rendering. Public users can contribute to that accumulation. Existing per-minute rate limits slow creation but do not bound the number of stored records later loaded by one request.

Recommendation: paginate nested submissions, select only summary fields for the list, calculate counts in the database, and define appropriate public-submission abuse/retention controls. Apply limits to the actual rows loaded, not only the parent building count.

Remaining validation: inspect query plans and representative data volumes before selecting thresholds. There is no measured denial-of-service threshold or demonstrated server crash.

### SEC-08 — Deletion fails after a submission acquires audit history

**Priority:** Medium privacy/functionality defect. **Status:** source-backed schema/service conflict; no real database test performed.

Evidence:

- `src/zenstack/migrations/20260612101806_added_submissions/migration.sql:81` declares the history-to-submission foreign key with `ON DELETE RESTRICT`.
- `src/zenstack/schema.zmodel` retains the required history relationship, and no later migration changing this foreign key was found.
- Assignment and later state changes create history rows in `src/submissions/submissions.service.ts`.
- Public deletion at line 357 deletes only the submission; admin deletion at line 365 also deletes only the submission. Neither removes or detaches history rows first.
- The deletion tests in `src/submissions/submissions.test.ts` mock database deletion and do not exercise the foreign key.

Impact: with the reviewed schema, a valid deletion request for a submission with history conflicts with the foreign key and reaches the generic error handler. The user-facing deletion flow cannot complete. This is a data-lifecycle defect, not a demonstrated unauthorized-access vulnerability.

Recommendation: decide the intended treatment of audit records on deletion, then implement a consistent transaction/schema policy. Depending on retention requirements, that could involve deleting dependent history, retaining anonymized/detached audit records, or a different data model. Do not add a blanket cascade without considering the audit requirements. Check separately what should happen to previously accepted building data.

Remaining validation: add a database-backed test covering submission creation, assignment/history creation, and authorized deletion once implementation/testing is approved.

### SEC-09 — The Civitas Core Traefik template disables upstream TLS verification globally

**Priority:** Medium; conditional on use with HTTPS upstreams. **Status:** source-backed template setting; deployed Traefik configuration unverified.

Evidence:

- `../civitas-core/core_platform/templates/traefik/helmchartconfig.yaml:48` describes a local-development exception, but line 50 unconditionally sets `--serversTransport.insecureSkipVerify=true`.
- No environment condition surrounds this setting in the reviewed template.

Potential impact: HTTPS upstream connections using that transport do not verify the upstream certificate chain or hostname. An attacker able to interfere with the internal network/DNS could impersonate an upstream. This does not itself provide external entry to the cluster and does not affect plain HTTP upstreams. The current addon backend service uses HTTP, so this is primarily a platform/migration concern for HTTPS upstreams.

Recommendation: remove the global exception from production configuration. Configure the appropriate trusted CA and server name for private HTTPS services; scope any development exception to an explicit development configuration.

Remaining validation: inspect the rendered configuration selected for the Traefik deployment and identify which upstream services use HTTPS and which transport they use.

Reference: [Traefik ServersTransport documentation](https://doc.traefik.io/traefik/reference/routing-configuration/http/load-balancing/serverstransport/).

## Findings carried forward from the initial pass

### SEC-01 — JWT verifier does not constrain issuer or audience

**Priority:** Medium hardening gap. **Status:** source-backed; no token substitution or authentication bypass demonstrated.

`src/auth/auth.service.ts:64` calls `jwtVerify` with `algorithms: ["RS256"]` but no expected issuer or audience. Restricting the JWKS source provides an important signing-key boundary, and application role checks remain in place. Exploitability would require an otherwise accepted token signed by a trusted key, with usable claims, to cross an unintended application boundary; gateway checks may prevent that.

Recommendation: define and validate the intended issuer and API audience, coordinate the Keycloak audience mapper, and check token type/required claims as appropriate. Revisit this when replacing gateway authentication.

The development/test path decodes unsigned tokens, but `Dockerfile:64` sets `NODE_ENV=production`. That development behavior is not reported as a deployed authentication bypass.

### SEC-02 — APISIX session secrets fall back to the administration key

**Priority:** Medium secret-separation concern. **Status:** source-backed fallback; actual inventory override unknown. **Migration relevance:** legacy APISIX configuration.

`../Regensburg_DigitalerEnergieZwilling_digital-energy-twin_addon/tasks/digital-energy-twin.yml:727`, `:861`, and `:1114` default the OIDC session secret to `inv_access.apisix.api_credentials.admin_role` when no dedicated secret is provided.

Recommendation: use independent secrets for session protection and gateway administration. Carry that separation into the replacement authentication component. Secret reuse increases the consequences of a secret disclosure; this review has not found or disclosed the secret itself.

### SEC-03 — Submission state and ownership checks are separated from the write

**Priority:** Medium integrity risk. **Status:** source-backed race candidate; no concurrent execution performed.

`src/submissions/submissions.service.ts:125` reads and checks a submission before the transaction at line 137; the update at line 139 matches only the ID. Equivalent read/check/write separation appears in unassignment, acceptance, decline, and deletion.

Potential impact: concurrent requests can act on stale state/ownership, overwrite assignments, or record transitions that no longer match the current state. The transaction groups the writes but does not make the earlier check atomic.

Recommendation: make updates conditional on expected state and, where relevant, ownership/version; check the affected-row count. Alternatively, use an appropriate locking/transaction strategy covering the checks and the writes. Validate competing transitions in an isolated database test.

## Traefik migration checkpoints

These are review requirements, not findings about an implementation that is not yet present in the addon checkout:

- Preserve verified authentication and application role checks for every admin route and host alias. The existing API also relies on gateway-to-backend access-token forwarding.
- Add explicit CSRF defenses wherever the replacement component authenticates through browser cookies.
- Establish trusted forwarded-header handling and separate per-client abuse limits from overall service capacity limits.
- Preserve capability-token redaction across the new access logs, application logs, and traces.
- Retain intended CORS and security-header policies; confirm them on static frontend responses as well as API responses.
- Verify upstream TLS using the appropriate private/public CA instead of carrying the global verification exception into production.

## Review disposition

No confirmed remote code execution, SSH compromise, unauthenticated admin access, or SQL injection was established. Those outcomes were neither tested nor ruled out by this limited review.

The public capability routes use explicit download-field selection and `Cache-Control: no-store`; unexpected errors are masked by the generic error handler; the feedback service enforces message/email length limits; and privileged mutations have role checks in middleware or the service layer. These controls were considered when assessing the findings above.

No findings should be closed or promoted to “verified in production” solely because a development container behaves differently. Match source and dependency versions to the intended release and collect narrowly scoped validation evidence when authorized.
