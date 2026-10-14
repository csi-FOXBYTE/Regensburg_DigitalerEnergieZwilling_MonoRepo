# Matomo image

The official `matomo:5.14.0-apache` image plus the
[LoginOIDC](https://github.com/dominik-th/matomo-plugin-LoginOIDC) plugin
(5.0.0), so Matomo users log in via the platform Keycloak. On every start the
entrypoint copies the plugin and [common.config.ini.php](common.config.ini.php)
into the volume, writes the Keycloak settings from the environment and
activates the plugin once Matomo is installed. Settings from the config file
are read-only in the Matomo UI.

Without `MATOMO_OIDC_ISSUER` the image behaves like the official one (password
login only), as in the devcontainer.

## Environment

| Variable | Required | Meaning |
| --- | --- | --- |
| `MATOMO_DATABASE_*` | yes | As in the official image. |
| `MATOMO_OIDC_ISSUER` | for SSO | Realm URL, e.g. `https://keycloak.example/realms/dez`. |
| `MATOMO_OIDC_CLIENT_ID` | for SSO | Keycloak client ID, e.g. `matomo`. |
| `MATOMO_OIDC_CLIENT_SECRET_FILE` | for SSO | Path to a mounted file with the client secret. |
| `MATOMO_OIDC_USERINFO_ID` | no | Claim used as the Matomo login. Default `preferred_username`. |
| `MATOMO_BEHIND_TLS_PROXY` | no | `1` when TLS ends at a proxy, so Matomo builds `https` URLs. |
| `MATOMO_DISABLE_TRUSTED_HOST_CHECK` | no | `1` for local development only. |

The fixed settings are: no self-signup (`allowSignup = 0`), and a Keycloak user
is linked to the Matomo user whose login equals their `preferred_username`
(`autoLinking = 1`). Password login stays available for the break-glass
superuser.

## Keycloak client

- Confidential OpenID Connect client with the standard flow.
- Valid redirect URI:
  `https://<matomo-host>/index.php?module=LoginOIDC&action=callback&provider=oidc`
- Valid post logout redirect URI: `https://<matomo-host>/*`
- Client scopes `email` and `profile`, so userinfo returns `email` and
  `preferred_username`.
- The realm must not let users change their username ("Edit username" off);
  otherwise a renamed account could take over another Matomo login.
- Matomo must reach the realm's token and userinfo endpoints directly.

## First deployment

1. Start Matomo with the variables above and install it once (web installer,
   or headless with
   [install.spec.ts](../../apps/frontend/tests/matomo/install.spec.ts)). The
   superuser created here is the break-glass account: keep its password in the
   secret store and enable two-factor authentication.
2. Restart the container. The log no longer says that Matomo is not installed,
   and the login page shows **Keycloak**.
3. For each person, create a Matomo user whose login is their Keycloak
   username and grant site access. Their first Keycloak login links the
   accounts. Keycloak users without a Matomo user are rejected.
