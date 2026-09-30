FROM apache/apisix:3.11.0-debian
COPY .devcontainer/apisix/apisix.yaml /usr/local/apisix/conf/apisix.yaml
COPY .devcontainer/apisix/config.yaml /usr/local/apisix/conf/config.yaml
