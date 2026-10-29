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
- Fehler aus Controllern, Services und Middlewares: `fastify-toab` `onRouteError` → `src/errors/route-error-handler.ts`
- Fehler, die Fastify oder Plugins vor dem Handler auslösen (Schema-Validierung, Body-Parsing, `415`, `413`, Rate Limit `429`, Under-Pressure `503`): Fastify-`setErrorHandler` → `src/errors/request-error-handler.ts`. Er wird in `onPreStart` gesetzt und gilt damit für alle API-Routen; die vorher registrierten Plugin-Routen (`/health`, CORS-Preflight) behalten ihr eigenes Fehlerschema.
- APISIX prüft Token vorgelagert; das Backend verifiziert Signatur und Claims zusätzlich selbst (`src/auth/auth.service.ts`).
- Statuscodes aus Framework-/Plugin-Fehlern bleiben erhalten. `5xx`-Antworten enthalten nie die interne Fehlermeldung.

## Status-Typen (AppErrorStatus)

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `METHOD_NOT_ALLOWED`
- `PAYLOAD_TOO_LARGE` (`413`)
- `UNSUPPORTED_MEDIA_TYPE` (`415`)
- `TOO_MANY_REQUESTS` (`429`, Header `Retry-After` bleibt erhalten)
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

### Fallback (unbekannte Fehler)

Alle nicht als `AppError` geworfenen Fehler werden auf:

- `INTERNAL_ERROR` / `500` / `Internal server error`

normalisiert.

## Erweiterungsregel

Neue fachliche Fehler sollen als `AppError` geworfen werden, damit:

- `status`, `code`, `message` konsistent bleiben,
- Clients stabile Fehlertypen erhalten,
- Produktionsantworten keinen Stacktrace enthalten.
