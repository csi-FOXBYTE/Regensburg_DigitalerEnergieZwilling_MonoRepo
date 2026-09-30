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

- `AppError`: `src/errors/app-error.ts`
- globaler Handler über `fastify-toab` `onRouteError`: `src/errors/route-error-handler.ts`
- Produktive JWT/OIDC-Validierung und Routenschutz erfolgen vorgelagert in APISIX; Backend-Auth-Fehler betreffen Header-/Claim-Auswertung innerhalb gateway-gerouteter Requests.

## Status-Typen (AppErrorStatus)

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `METHOD_NOT_ALLOWED`
- `INTERNAL_ERROR`

## Aktuell implementierte Fehlerarten

### Auth / Header-Validierung

- `BAD_REQUEST` / `400` / `Request header is malformed`
- `UNAUTHORIZED` / `401` / `Authorization header must be a Bearer token`
- `UNAUTHORIZED` / `401` / `Access token is missing`

### Token-Claims / lokale Dev-Middleware

- `UNAUTHORIZED` / `401` / `Access token payload is invalid`
- `UNAUTHORIZED` / `401` / `Access token has expired`
- `UNAUTHORIZED` / `401` / `Access token is not active yet`

### Fallback (unbekannte Fehler)

Alle nicht als `AppError` geworfenen Fehler werden auf:

- `INTERNAL_ERROR` / `500` / `Internal server error`

normalisiert.

## Erweiterungsregel

Neue fachliche Fehler sollen als `AppError` geworfen werden, damit:

- `status`, `code`, `message` konsistent bleiben,
- Clients stabile Fehlertypen erhalten,
- Produktionsantworten keinen Stacktrace enthalten.
