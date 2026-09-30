# Backend API

Node.js/TypeScript-Backend auf Fastify v5 mit `@csi-foxbyte/fastify-toab`, APISIX-geschuetzter Auth-/Rollenpruefung und BullMQ-UI.

## Basis-URL

Wichtig: Alle Requests in der lokalen Umgebung ueber

- `http://localhost:5000`

Die API wird intern auf Port `5000` gestartet, aber der externe Einstieg ist APISIX.
Von außen ist nur APISIX auf `localhost:5000` sichtbar.
Ist der User nicht authentifiziert, erfolgt der Login ueber Keycloak. Nach erfolgreichem Login setzt Keycloak ein verschluesseltes JWT-Token als Browser-Cookie; APISIX prueft dieses Cookie und schuetzt die Routen. Das Backend prueft keine JWT-Signatur.

## Zweck

Dieses Repo startet einen HTTP-Server mit:

- Auswertung von APISIX-geprueften Access-Token-Claims und Rollen
- TOAB-Controller/Service-Registrierung
- Swagger UI unter `/docs`
- BullMQ-Board unter `/bullMQ`
- zentralem Pino-Logging (inkl. `console.*`-Injection)

## Tech Stack

- Node.js (ESM)
- TypeScript
- Fastify 5
- Pino + pino-pretty
- `@csi-foxbyte/fastify-toab`
- BullMQ + Bull Board

## Projektstruktur (relevant)

- `src/index.ts`: App-Bootstrap, Fastify-Setup, Plugins, Listen
- `src/lib/pino.ts`: Logger-Setup + `injectPinoLogger`
- `src/auth/*`: Auth DTOs, Service, Controller, Middleware
- `src/test/test.controller.ts`: geschuetzte Test-Route
- `src/registries.ts`: autogenerierte TOAB Registries
- `scripts/create-dev-jwt.mjs`: Dev-JWT Generator
- `dev.ts`: lokaler Dev-Runner mit Watch + Restart
- `esbuild.ts`: Build/Dev-Build Funktionen

## Voraussetzungen

- Node.js 20+ (empfohlen aktuell LTS)
- pnpm 10+

## Installation

```bash
pnpm install
```

## Lokaler Start

```bash
pnpm dev
```

Der Dev-Runner:

- baut TypeScript nach `.dev/`
- watched `src/**`
- startet Node mit `NODE_ENV=development`
- startet bei Aenderungen neu

Interner App-Port ist `5000` (falls `PORT` nicht gesetzt ist). Externe Requests laufen ueber APISIX auf `http://localhost:5000`.

## Wichtige Endpunkte

- `GET /docs` -> Swagger UI
- `GET /bullMQ` -> Bull Board UI
- `GET /admin/api/auth/verify` -> gibt den vom Gateway geprueften Token-Payload zurueck
- `GET /api/admin/test/` -> geschuetzte Test-Route (Route durch APISIX geschuetzt, Backend-Rollenpruefung aktiv)

## Umgebungsvariablen (.env)

Aktuell sind keine verpflichtenden Auth-Umgebungsvariablen konfiguriert.
JWT/OIDC-Validierung, Signaturpruefung und Routenschutz erfolgen in APISIX. Grundlage ist das von Keycloak nach dem Login gesetzte verschluesselte JWT-Cookie im Browser.
Das Backend dekodiert den uebergebenen Token nur zur Auswertung von Claims/Rollen und vertraut produktiv ausschliesslich auf Gateway-geroutete Requests.
Optional fuer Rollenpruefung ueber `resource_access`:

```env
AUTH_RESOURCE_ACCESS_CLIENT_ID=digital-energy-twin
```

Wenn nicht gesetzt, wird standardmaessig `digital-energy-twin` verwendet.

Geplantes Rollenmodell:
- `Verwalter`: eingereichte Gebaeudedaten lesen und bearbeiten, kein Zugriff auf Systempflege.
- `Systempfleger`: Zugriff auf Systempflege, kein Zugriff auf eingereichte Gebaeudedaten.
- `Administrator`: voller Zugriff auf den internen Client.

## Dev-JWT fuer lokale Entwicklung erzeugen

Schnellstart:

```bash
pnpm jwt:dev
```

Raw Token:

```bash
pnpm jwt:dev --output raw
```

Beispiel mit eigenen Werten:

```bash
pnpm jwt:dev \
  --key dev_admin \
  --secret dev_admin-secret-change-me \
  --issuer http://localhost:8080/realms/dev \
  --audience account \
  --client-id digital-energy-twin \
  --roles Administrator,Verwalter \
  --ttl 3600
```

Hilfe:

```bash
pnpm jwt:dev --help
```

## Lokale API-Aufrufe mit Dev-Token

Produktiv werden Tokens durch APISIX/OIDC geprueft. Die folgenden Aufrufe dienen nur der lokalen Entwicklung der Backend-Middleware.

### 1) Mit Bearer bzw. x-access-token

```bash
TOKEN="$(pnpm -s jwt:dev --output raw)"

curl -i http://localhost:5000/admin/api/auth/verify \
  -H "x-access-token: ${TOKEN}"

curl -i http://localhost:5000/api/admin/test/ \
  -H "Authorization: Bearer ${TOKEN}"
```

## Logging

- `src/instrumentation.ts` installiert `injectPinoLogger()` beim Laden des Moduls, vor dem Aufruf von `startServer()`. Dadurch werden auch Fehler bei der Umgebungsvalidierung und beim Serverstart ueber Pino ausgegeben.
- `console.log/info/warn/error/debug` erzeugen nur ein festes `console_output`-Ereignis mit Log-Level und ggf. einer festen Fehlerkategorie. Freitext, Objekte, Fehlermeldungen, Ursachen und Stacks werden nicht uebernommen, da sie Nutzereingaben enthalten koennen.
- Der Instrumentation-Hook deaktiviert die ungefilterten Framework- und Request-Logger. Eigene Hooks protokollieren pro Request einmal das Ergebnis: serverseitig erzeugte Log-Request-ID, HTTP-Methode, registriertes Routenmuster, Statuscode, Dauer und ggf. Fehlerkategorie. Unbekannte Routen erhalten `unmatched_route`; URLs, Query-Parameter, Tokens, Header, IP-Adressen und Request-/Response-Inhalte werden nicht geloggt. Diese Regeln gelten auch in Entwicklung.
- Datenbankfehler werden als `DATABASE_ERROR` klassifiziert. SQL, SQL-Parameter und Datenbank-Fehlerdetails bleiben aus den Logs. Neue Diagnosen sollen feste Ereignisse ueber `src/lib/pino.ts` verwenden; `fastify.log` und `request.log` sind absichtlich stumm.
- In Produktion werden JSON-Zeilen ausgegeben; nur bei `NODE_ENV=development` wird `pino-pretty` verwendet.
- Das Backend schreibt seine Logs ausschliesslich auf `stdout`/`stderr`; das passt zum Container-Betrieb unter Kubernetes.
- Container-Logs können dadurch direkt von Promtail oder Grafana Alloy eingesammelt werden.
- Die Dev-APISIX-Konfiguration protokolliert nur Zeitpunkt, Status und Dauer sowie Upstream-Status. Der ungefilterte Nginx-Error-Log wird nach `/dev/null` geleitet, weil er Request-URLs enthalten kann. Dadurch entfallen detaillierte Gateway-Fehlermeldungen; Fehler bleiben ueber Statuscodes sichtbar. Konfigurationsquelle ist `.devcontainer/apisix/config.yaml`, nicht die generierte `nginx.conf`. Nach Aenderungen muss das APISIX-Image neu gebaut und der Container neu erstellt werden.
- In Produktion muessen Gateway/Ingress und Datenbank-Logging separat entsprechend konfiguriert werden. Diese Repository-Aenderung aktualisiert keine laufende Produktionsumgebung und entfernt keine bestehenden Logs. Insbesondere keine Request-/Response-Bodies, URLs mit Tokens, SQL-Parameter oder ungefilterte Datenbankfehler sammeln. APISIX-Konfigurationsreferenz: https://apisix.apache.org/docs/apisix/customize-nginx-configuration/

## Fehlerformat

Route-Fehler laufen ueber `routeErrorHandler` und werden als `AppError`-Response serialisiert:

```json
{
  "status": "UNAUTHORIZED",
  "code": 401,
  "message": "Access token is missing"
}
```

Im Development kann zusaetzlich `stack` enthalten sein.

## Hinweise zum Build

`pnpm build` nutzt `build.ts`.

## Dokumentation (fachlich/architektonisch)

Ausführliche System- und Architekturdocs liegen unter:

- `docs/README.md`
- `docs/system/*`
- `docs/architecture/*`
- `docs/requirements/*`

## Software bill of materials

The checked-in `SBOM.cdx.json` is a CycloneDX 1.6 inventory and `SBOM.csv`
contains the same components in a review-friendly format. The inventory includes
production npm dependencies and the container, package-manager, and explicitly
installed operating-system software used to build and run the backend. Test and
lint-only development dependencies are excluded.

SBOM generation uses the application's pinned pnpm 10 dependency-list command
and constructs the CycloneDX graph from installed package metadata:

```bash
pnpm run sbom
```

Keep `sbom.config.json` synchronized with the Dockerfile.
For every Git tag, the image workflow regenerates the CycloneDX file with the
tag as its component version and publishes it as a signed SBOM attestation for
the exact GHCR image digest.
