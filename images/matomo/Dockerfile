# syntax=docker/dockerfile:1
# Matomo with the LoginOIDC plugin for login via Keycloak, plus NoPasswordReset.
# Without MATOMO_OIDC_* variables it behaves like the official image (password
# login only).
FROM matomo:5.14.0-apache
ADD --checksum=sha256:265433ec2cc526b627e3bb124c76c3521309d2a8becce06db95d89ce65a60bb2 \
  https://github.com/dominik-th/matomo-plugin-LoginOIDC/archive/refs/tags/5.0.0.tar.gz /tmp/loginoidc.tar.gz
RUN mkdir -p /opt/matomo-plugins/LoginOIDC \
  && tar xzf /tmp/loginoidc.tar.gz -C /opt/matomo-plugins/LoginOIDC --strip-components=1 \
  && rm /tmp/loginoidc.tar.gz
COPY plugins/NoPasswordReset /opt/matomo-plugins/NoPasswordReset
COPY common.config.ini.php /opt/matomo-config/common.config.ini.php
COPY --chmod=755 entrypoint.sh /usr/local/bin/matomo-entrypoint.sh
ENTRYPOINT ["matomo-entrypoint.sh"]
CMD ["apache2-foreground"]
