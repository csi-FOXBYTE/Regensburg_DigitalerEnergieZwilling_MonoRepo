# syntax=docker/dockerfile:1
ARG NODE_BASE_IMAGE=node:24.22.1-bookworm-slim
ARG RUNTIME_BASE_IMAGE=nginxinc/nginx-unprivileged:1.30.6-alpine
FROM ${NODE_BASE_IMAGE} AS build
ARG RELEASE_REFRESH=0
RUN echo "External dependency refresh: ${RELEASE_REFRESH}" && apt-get update && apt-get install -y --no-install-recommends git ca-certificates openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.22.0
WORKDIR /workspace
RUN chown node:node /workspace
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --chown=node:node packages/energy-core/package.json ./packages/energy-core/package.json
COPY --chown=node:node apps/frontend/package.json ./apps/frontend/package.json
COPY --chown=node:node apps/adminfrontend/package.json ./apps/adminfrontend/package.json
COPY --chown=node:node apps/backend/package.json ./apps/backend/package.json
USER node
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
RUN pnpm --filter ./packages/energy-core build:code
RUN pnpm --filter ./apps/frontend build
ARG BUILD_ID=local
ARG SOURCE_COMMIT=local
RUN node scripts/artifact-sbom.mjs frontend
RUN cp apps/frontend/LICENSE apps/frontend/COPYING apps/frontend/COPYING.LESSER apps/frontend/NOTICE apps/frontend/dist/
RUN mkdir -p apps/frontend/dist/licenses && cp apps/frontend/node_modules/@fontsource-variable/geist/LICENSE apps/frontend/dist/licenses/Geist-OFL-1.1.txt && cp apps/frontend/node_modules/@fontsource/open-sans/LICENSE apps/frontend/dist/licenses/Open-Sans-OFL-1.1.txt
FROM ${RUNTIME_BASE_IMAGE} AS production
ARG RELEASE_REFRESH=0
# Pick up Alpine fixes published after the base image was built. A new
# refresh epoch rebuilds this layer.
USER root
RUN echo "External dependency refresh: ${RELEASE_REFRESH}" && apk upgrade --no-cache
COPY --chown=101:101 apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /workspace/apps/frontend/dist /usr/share/nginx/html
COPY --from=build --chown=101:101 /workspace/apps/frontend/SBOM.cdx.json /usr/share/regensburg/SBOM.cdx.json
COPY --chmod=755 scripts/runtime-version.sh /docker-entrypoint.d/40-app-version.sh
USER 101:101
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
ARG BUILD_ID=local
ARG SOURCE_COMMIT=local
LABEL org.opencontainers.image.licenses="LGPL-3.0-or-later" \
      org.opencontainers.image.source="https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo" \
      org.opencontainers.image.version="build-${BUILD_ID}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}"
