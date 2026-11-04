# Fehler- und Ausnahmebehandlung (AppError)

Dieses Dokument beschreibt das einheitliche Fehlermodell im Backend.

## Ziel

Alle Fehlerantworten folgen demselben Schema:

```json
{
  "status": "UNAUTHORIZED",
  "code": 401,
  "message": "Access token is missing"
}
```

In `NODE_ENV=development` wird zusätzlich `stack` zurückgegeben.
Außerhalb von Development wird kein Stacktrace an Clients ausgeliefert.

## Quelle der Fehlerbehandlung

- `AppError` und gemeinsames Senden (`sendAppError`): `src/errors/app-error.ts`
- Fehler aus Controllern, Services und Middlewares: `fastify-toab` `onRouteError` → `src/errors/route-error-handler.ts`. Datenbankfehler, die ein Client auslösen kann, bildet `src/errors/database-error.ts` vorher auf `4xx` ab (siehe unten).
- Fehler, die Fastify oder Plugins vor dem Handler auslösen (Schema-Validierung, Body-Parsing, Request-Guards aus `src/lib/request-guards.ts`, `415`, `413`, Under-Pressure `503`; das Backend hat kein eigenes Rate Limit, das übernimmt APISIX je Client): Fastify-`setErrorHandler` → `src/errors/request-error-handler.ts`. Er wird in `onPreStart` gesetzt und gilt damit für alle API-Routen; die vorher registrierten Plugin-Routen (`/health`, CORS-Preflight) behalten ihr eigenes Fehlerschema.
- APISIX prüft Token vorgelagert; das Backend verifiziert Signatur und Claims zusätzlich selbst (`src/auth/auth.service.ts`).
- Statuscodes aus Framework-/Plugin-Fehlern bleiben erhalten. `5xx`-Antworten enthalten nie die interne Fehlermeldung.

## Status-Typen (AppErrorStatus)

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `METHOD_NOT_ALLOWED`
- `CONFLICT` (`409`)
- `PAYLOAD_TOO_LARGE` (`413`)
- `UNSUPPORTED_MEDIA_TYPE` (`415`)
- `TOO_MANY_REQUESTS` (`429`, Header `Retry-After` bleibt erhalten; das Backend erzeugt selbst keine `429`, Rate Limiting erfolgt in APISIX)
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE` (`503`, Header `Retry-After` bleibt erhalten)

Andere `4xx`-Codes behalten ihren Code und erhalten den Status `BAD_REQUEST`.

## Aktuell implementierte Fehlerarten

### Auth / Header-Validierung

- `BAD_REQUEST` / `400` / `Request header is malformed`
- `UNAUTHORIZED` / `401` / `Authorization header must be a Bearer token`
- `UNAUTHORIZED` / `401` / `Access token is missing`

### Token-Prüfung

- `UNAUTHORIZED` / `401` / `Access token is invalid` (Signatur, `iss`, `aud`, Token-Typ, Algorithmus, unbekannter Schlüssel)
- `UNAUTHORIZED` / `401` / `Access token payload is invalid`
- `UNAUTHORIZED` / `401` / `Access token has expired`
- `UNAUTHORIZED` / `401` / `Access token is not active yet`
- `SERVICE_UNAVAILABLE` / `503` / `Access token cannot be verified right now` (JWKS nicht erreichbar oder ungültig; Log-Event `auth_key_set_unavailable`)

### Eingabevalidierung

- `BAD_REQUEST` / `400` / Meldung der Schema-Validierung: Typ-, Längen- oder Wertebereichsverletzung sowie unbekannte Body- oder Query-Felder. JSON-Bodies werden nicht typumgewandelt; Query- und Pfadparameter werden als Text in den deklarierten Typ umgewandelt.
- `BAD_REQUEST` / `400` / `Request must not contain NUL characters` (Body, Query oder Pfadparameter)
- `BAD_REQUEST` / `400` / `Request body must not be nested deeper than 32 levels`
- `BAD_REQUEST` / `400` / `Numeric parameters must be finite` (z. B. `Infinity` oder `1e400` in Query- oder Pfadparametern)
- `UNSUPPORTED_MEDIA_TYPE` / `415` / `JSON request bodies must be UTF-8` (JSON-Body mit anderem `charset`)

### Datenbank

- `CONFLICT` / `409` / `The resource was changed by a concurrent request, please retry` (Serialisierungsfehler, Deadlock, Unique- oder Foreign-Key-Verletzung, nicht erhaltene Sperre)
- `NOT_FOUND` / `404` / `Not found` (Datensatz wurde zwischen Prüfung und Schreibzugriff entfernt)
- `BAD_REQUEST` / `400` / `Request contains characters that cannot be stored`

Die Antwort enthält nie die Meldung des Datenbanktreibers.

### Fallback (unbekannte Fehler)

Alle nicht als `AppError` geworfenen Fehler werden auf:

- `INTERNAL_ERROR` / `500` / `Internal server error`

normalisiert.

## Erweiterungsregel

Neue fachliche Fehler sollen als `AppError` geworfen werden, damit:

- `status`, `code`, `message` konsistent bleiben,
- Clients stabile Fehlertypen erhalten,
- Produktionsantworten keinen Stacktrace enthalten.
