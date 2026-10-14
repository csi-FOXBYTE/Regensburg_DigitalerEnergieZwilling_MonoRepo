# Keycloak login test

Throwaway Matomo (this image) and Keycloak for checking the Keycloak login by
hand. Own Compose project `matomo-sso-test`, separate from the devcontainer,
so `down` here deletes nothing else. Not for production: all passwords and the
client secret are fixed test values.

## Requirements

- Docker with Compose v2, run from a host shell (WSL, Git Bash), not from the
  devcontainer
- Free local ports 8092 (Keycloak) and 8093 (Matomo)
- `127.0.0.1 keycloak` in the hosts file of the machine running the browser
  (on WSL: `C:\Windows\System32\drivers\etc\hosts`, edited as administrator).
  The browser and Matomo must both reach Keycloak as `http://keycloak:8092`,
  otherwise Keycloak rejects the token at the userinfo endpoint.

## Use

```bash
images/matomo/sso-test/sso-test.sh up    # build, install Matomo, restart, create the Matomo user anna
images/matomo/sso-test/sso-test.sh logs  # follow Matomo and Keycloak
images/matomo/sso-test/sso-test.sh down  # stop and delete everything, including data
```

| What | Address | Login |
| --- | --- | --- |
| Matomo | http://localhost:8093/ | break-glass `admin` / `admin-Passw0rd!` |
| Keycloak admin console | http://keycloak:8092/admin/ | `admin` / `admin` (master realm) |

The realm `dez` comes from [realm-dez.json](realm-dez.json). Its users log in
with their username as password:

| Keycloak user | Matomo user | Purpose |
| --- | --- | --- |
| `anna` | `anna`, view access to site 1 | Normal Keycloak login |
| `ben` | none | Must be rejected |
| `admin` | `admin` is the break-glass superuser | Must not be able to take over the superuser |

Use a private browser window per test, so no session is left over.

## Checks

| # | Check | Expected |
| --- | --- | --- |
| B1 | `up` output after the restart | No "not installed yet" message; LoginOIDC is active |
| B2 | Matomo login page | A **Keycloak** button next to the password form; under *Administration > System > General settings > LoginOIDC* the settings are read-only |
| B3 | Keycloak button, log in as `anna` | Back in Matomo as `anna`, site 1 visible |
| B4 | Keycloak button, log in as `ben` | Matomo shows an error, no user `ben` appears under *Administration > System > Users* |
| B5 | As `anna`: log out in Matomo, then click the Keycloak button again | Logout ends on Keycloak's "logged out" page (no redirect back, Matomo sends no `post_logout_redirect_uri`); the next login asks for the password again |
| B6 | Password form, `admin` / `admin-Passw0rd!` | Works |
| B7 | Keycloak button, log in as Keycloak user `admin` | Matomo shows an error that superusers cannot log in this way (`disableSuperuser = 1`); you are not logged in |
| B8 | `MATOMO_OIDC_CLIENT_ID= docker compose -f images/matomo/sso-test/compose.yml up -d matomo`, then `logs matomo` | Container stops with "MATOMO_OIDC_CLIENT_ID: is required with MATOMO_OIDC_ISSUER". Restore with the same command without the variable |
