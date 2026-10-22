# Local, explicit openCode audits only. Normal CI and release images never build this.
FROM anchore/syft:v1.54.1 AS syft
FROM docker:29-cli AS docker-cli
FROM node:24.22.1-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates python3 python3-venv libgomp1 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.22.0
COPY scripts/compliance/requirements.txt /tmp/compliance-requirements.txt
RUN python3 -m venv /opt/scancode && /opt/scancode/bin/pip install -r /tmp/compliance-requirements.txt
COPY --from=syft /syft /usr/local/bin/syft
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-cli /usr/local/libexec/docker/cli-plugins/docker-buildx /usr/local/libexec/docker/cli-plugins/docker-buildx
ENV SCANCODE=/opt/scancode/bin/scancode SPDX_PYTHON=/opt/scancode/bin/python
USER node
ENTRYPOINT ["node"]
