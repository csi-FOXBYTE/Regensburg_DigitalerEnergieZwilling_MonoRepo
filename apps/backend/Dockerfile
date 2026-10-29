# syntax=docker/dockerfile:1
ARG NODE_BASE_IMAGE=node:24.22.2-bookworm-slim
ARG RUNTIME_BASE_IMAGE=debian:bookworm-slim
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
ARG RELEASE_REFRESH=0
# A plain Debian base: npm and corepack never enter a layer, only the node binary
# of the build stage does. Debian fixes published after the base image apply on
# each refresh epoch, like the Alpine upgrade of the client images.
RUN echo "External dependency refresh: ${RELEASE_REFRESH}" && apt-get update && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1000 node && useradd --uid 1000 --gid node --shell /bin/bash --create-home node
COPY --from=build /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=5000
WORKDIR /app
COPY --from=build --chown=node:node /workspace/.deploy/backend/ ./
COPY --from=build --chown=node:node /workspace/apps/backend/.build ./.build
COPY --from=build --chown=node:node /workspace/apps/backend/SBOM.cdx.json /usr/share/regensburg/SBOM.cdx.json
USER 1000:1000
# The add-on's migration init container runs node_modules/.bin/zenstack migrate
# deploy. Fail the build if zenstack cannot load prisma itself (its fallback,
# npx, is not in this image) or if the "files" allowlist of package.json
# dropped the schema or the migrations.
RUN node -e "require('node:module').createRequire(require('node:fs').realpathSync('node_modules/@zenstackhq/cli/dist/index.js')).resolve('prisma/build/index.js')" \
  && test -f src/zenstack/schema.zmodel && test -d src/zenstack/migrations
EXPOSE 5000
CMD ["node", "--expose-gc", ".build/@internals/run.js"]
ARG BUILD_ID=local
ARG SOURCE_COMMIT=local
LABEL org.opencontainers.image.licenses="LGPL-3.0-or-later" \
      org.opencontainers.image.source="https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo" \
      org.opencontainers.image.version="build-${BUILD_ID}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}"
