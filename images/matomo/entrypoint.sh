#!/bin/bash
# Prepares Matomo on every start, then hands over to the official entrypoint:
# copies the plugins (LoginOIDC, NoPasswordReset) and the config into the
# volume, adds the Keycloak settings from the environment and activates the
# plugins once Matomo is installed.
set -euo pipefail
cd /var/www/html

# Let the official entrypoint fill an empty volume first.
/entrypoint.sh true

mkdir -p config plugins
config=config/common.config.ini.php
cp /opt/matomo-config/common.config.ini.php "$config"
plugins=(LoginOIDC NoPasswordReset)
for plugin in "${plugins[@]}"; do
  rm -rf "plugins/$plugin"
  cp -r "/opt/matomo-plugins/$plugin" "plugins/$plugin"
done

check_ini_value() {
  case "$2" in
    *'"'* | *$'\n'*) echo >&2 "error: $1 must not contain quotes or line breaks"; exit 1 ;;
  esac
}

if [ "${MATOMO_DISABLE_TRUSTED_HOST_CHECK:-}" = 1 ]; then
  printf '\n[General]\nenable_trusted_host_check = 0\n' >> "$config"
elif [ "${MATOMO_BEHIND_TLS_PROXY:-}" = 1 ]; then
  printf '\n[General]\nassume_secure_protocol = 1\n' >> "$config"
fi

oidc_enabled=
if [ -n "${MATOMO_OIDC_ISSUER:-}" ]; then
  oidc_enabled=1
  : "${MATOMO_OIDC_CLIENT_ID:?is required with MATOMO_OIDC_ISSUER}"
  : "${MATOMO_OIDC_CLIENT_SECRET_FILE:?is required with MATOMO_OIDC_ISSUER}"
  endpoint=${MATOMO_OIDC_ISSUER%/}/protocol/openid-connect
  # Token and userinfo are called by Matomo itself, e.g. via an internal URL.
  backchannel=${MATOMO_OIDC_BACKCHANNEL_URL:-$MATOMO_OIDC_ISSUER}
  backchannel=${backchannel%/}/protocol/openid-connect
  client_secret=$(cat "$MATOMO_OIDC_CLIENT_SECRET_FILE")
  userinfo_id=${MATOMO_OIDC_USERINFO_ID:-preferred_username}
  check_ini_value MATOMO_OIDC_ISSUER "$endpoint"
  check_ini_value MATOMO_OIDC_BACKCHANNEL_URL "$backchannel"
  check_ini_value MATOMO_OIDC_CLIENT_ID "$MATOMO_OIDC_CLIENT_ID"
  check_ini_value MATOMO_OIDC_CLIENT_SECRET_FILE "$client_secret"
  check_ini_value MATOMO_OIDC_USERINFO_ID "$userinfo_id"
  cat >> "$config" <<EOF

[LoginOIDC]
authenticationName = "Keycloak"
authorizeUrl = "$endpoint/auth"
tokenUrl = "$backchannel/token"
userinfoUrl = "$backchannel/userinfo"
endSessionUrl = "$endpoint/logout"
clientId = "$MATOMO_OIDC_CLIENT_ID"
clientSecret = "$client_secret"
scope = "openid email profile"
userinfoId = "$userinfo_id"
allowSignup = 0
autoLinking = 1
disableSuperuser = 1
disableDirectLoginUrl = 1
bypassTwoFa = 0
EOF
fi

for plugin in "${plugins[@]}"; do chown -R www-data:www-data "plugins/$plugin"; done
chown -R www-data:www-data config

# Activation needs a finished installation; the first start skips it.
if [ -n "$oidc_enabled" ]; then
  if grep -q '^\[database\]' config/config.ini.php 2>/dev/null \
    && ! grep -q '^installation_in_progress' config/config.ini.php; then
    su -s /bin/bash www-data -c "./console plugin:activate ${plugins[*]}" \
      || echo >&2 "warning: could not activate ${plugins[*]}"
  else
    echo >&2 'LoginOIDC: Matomo is not installed yet; restart after the installation to activate it'
  fi
fi

exec /entrypoint.sh "$@"
