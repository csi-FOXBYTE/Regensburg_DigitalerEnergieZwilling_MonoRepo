# Local Matomo for the web analytics

Runs a throwaway Matomo next to a build of the public frontend, so the
consent-gated web analytics can be tried out by hand and checked automatically.
Everything runs in Docker; nothing is installed on the host. Not for production.

The tracking concept is in
[06-matomo-trackingkonzept.md](../../../backend/docs/system/06-matomo-trackingkonzept.md).

## Requirements

- Docker with Compose v2
- A Bash shell (Git Bash on Windows)
- Free local ports 8090 (Matomo) and 4329 (frontend), or set `MATOMO_PORT` and
  `WEB_PORT`

## Use

Run these from the repository root:

```bash
apps/frontend/tests/matomo/matomo.sh up       # start, install Matomo, build and serve the frontend
apps/frontend/tests/matomo/matomo.sh test     # automated check against the real Matomo (deletes all visits first)
apps/frontend/tests/matomo/matomo.sh seed 30  # add visits from 30 simulated users
apps/frontend/tests/matomo/matomo.sh reset    # delete all visits
apps/frontend/tests/matomo/matomo.sh rebuild  # rebuild the frontend after code changes
apps/frontend/tests/matomo/matomo.sh down     # stop and delete everything, including data
```

The first `up` takes a few minutes for dependencies and the frontend build.

| What | Address |
| --- | --- |
| Frontend with web analytics | http://localhost:4329/de/ |
| Matomo (`admin` / `admin-Passw0rd!`) | http://localhost:8090/ |

To try it by hand, open the frontend, choose **Alle erlauben** in the consent
dialog and go through the renovation check. The events appear immediately in
Matomo under **Visitors > Visits Log**. Reports such as **Behaviour > Events**
are built when you open them.

## How it works

- `matomo-db` and `matomo` run MariaDB and the official `matomo:5.14.0-apache`
  image. `install.spec.ts` clicks through the web installer once and creates
  site 1. `configure.spec.ts` and `matomo.sh` then apply the configuration the
  tracker is designed for, which a production instance needs as well:
  - `[Tracker] trust_visitors_cookies = 1`, so a visit is the tab session the
    tracker sends. Without it Matomo merges everyone with the same IP and
    browser into one visit.
  - "Disable all tracking cookies" **off**: when on, Matomo ignores the session
    reference with the same effect. The tracker sets no cookies either way.
  - IP fully masked, no referrer, geolocation disabled. The devcontainer
    instance also enforces the CNIL compliance policy
    (`MATOMO_COMPLIANCE_POLICY=cnil_v1`), which this one leaves off because it
    disables the visits log the funnel check reads.
- `web` copies this checkout, builds `apps/frontend` and serves it with
  `serve.mjs`. The server answers `/api/public/analytics-config` with the local
  Matomo, as the backend does when `MATOMO_URL` and `MATOMO_SITE_ID` are set.
  All other requests (API, address database, tiles) go to the deployed test
  system (`UPSTREAM`, default `https://det.rg.foxbyte.de`).
- `matomo.sh test` empties the visit log and runs `funnel.spec.ts` in the
  Playwright image on the same Docker network. It goes through the whole check,
  withdraws the consent, and then checks through the Matomo API that there is
  exactly one visit with all events in the order they were triggered, that no
  cookie is set, and that nothing arrives after the withdrawal. Screenshots and
  traces of failures go to `results/`.
- `matomo.sh seed` (`seed.spec.ts`) produces realistic data the same way a
  person would: each simulated user clicks through the real app in a fresh
  browser (some with mobile emulation), and the real tracker sends to Matomo.
  Behaviour comes from a seeded random generator, so the same number of users
  gives the same data. Users decline consent, leave at different steps, choose
  building types and measures, and download the report or click the advice
  link. Only the external advice website is replaced by a stub page. All users
  come from the same container, so the Visits Log shows the same anonymized
  IP and browser for all of them.

## Limits

- The privacy configuration above is the proposal, not yet the approved
  operating parameters (retention periods, for example, are not set).
- The data donation is not clicked through, because it would create real
  submissions on the deployed backend.
- Corporate TLS inspection replaces the certificates of some map hosts.
  The automated test therefore ignores certificate errors.
