# syntax=docker/dockerfile:1
ARG NODE_BASE_IMAGE=node:24.22.1-bookworm-slim
ARG RUNTIME_BASE_IMAGE=node:24.22.1-bookworm-slim
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
RUN pnpm --filter ./apps/backend generate
RUN pnpm --filter ./apps/backend build
ARG BUILD_ID=local
ARG SOURCE_COMMIT=local
RUN node scripts/artifact-sbom.mjs backend
RUN pnpm --filter ./apps/backend deploy --prod --legacy /workspace/.deploy/backend
FROM ${RUNTIME_BASE_IMAGE} AS production
# The runtime only needs node; npm and corepack from the base image are unused
# and bring their own vulnerable dependencies (e.g. undici, brace-expansion).
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/* \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=5000
WORKDIR /app
COPY --from=build --chown=node:node /workspace/.deploy/backend/ ./
COPY --from=build --chown=node:node /workspace/apps/backend/.build ./.build
COPY --from=build --chown=node:node /workspace/apps/backend/SBOM.cdx.json /usr/share/regensburg/SBOM.cdx.json
USER 1000:1000
EXPOSE 5000
CMD ["node", "--expose-gc", ".build/@internals/run.js"]
ARG BUILD_ID=local
ARG SOURCE_COMMIT=local
LABEL org.opencontainers.image.licenses="LGPL-3.0-or-later" \
      org.opencontainers.image.source="https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo" \
      org.opencontainers.image.version="build-${BUILD_ID}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}"
