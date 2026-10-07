FROM apache/apisix:3.11.0-debian
COPY --chown=636:636 .devcontainer/apisix/apisix.yaml /usr/local/apisix/conf/apisix.yaml
COPY --chown=636:636 .devcontainer/apisix/config.yaml /usr/local/apisix/conf/config.yaml
