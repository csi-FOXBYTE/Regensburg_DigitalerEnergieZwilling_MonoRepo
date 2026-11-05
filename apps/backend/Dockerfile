# syntax=docker/dockerfile:1
ARG NODE_BASE_IMAGE=node:24.22.2-alpine3.24
ARG RUNTIME_BASE_IMAGE=alpine:3.24
# Both stages are Alpine of the same release: pnpm installs the musl builds of
# native modules, and the node binary links against the runtime's libstdc++.
FROM ${NODE_BASE_IMAGE} AS build
ARG RELEASE_REFRESH=0
RUN echo "External dependency refresh: ${RELEASE_REFRESH}" && apk add --no-cache git ca-certificates openssl python3 make g++
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
RUN node apps/backend/scripts/install-prisma-engines.mjs /workspace/.deploy/backend
FROM ${RUNTIME_BASE_IMAGE} AS production
ARG RELEASE_REFRESH=0
# A plain Alpine base: npm and corepack never enter a layer, only the node binary
# of the build stage does. Alpine fixes published after the base image apply on
# each refresh epoch, like in the client images. node needs libstdc++ and
# libgcc, the Prisma engines libgcc and libssl3. apk itself is removed
# afterwards, so the runtime has no package manager; its database stays for
# scanners.
RUN echo "External dependency refresh: ${RELEASE_REFRESH}" && apk upgrade --no-cache \
  && apk add --no-cache ca-certificates-bundle libcrypto3 libgcc libssl3 libstdc++ \
  && apk del --no-cache apk-tools \
  && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node
COPY --from=build /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=5000
WORKDIR /app
COPY --from=build --chown=node:node /workspace/.deploy/backend/ ./
COPY --from=build --chown=node:node /workspace/apps/backend/.build ./.build
COPY --from=build --chown=node:node /workspace/apps/backend/SBOM.cdx.json /usr/share/regensburg/SBOM.cdx.json
USER 1000:1000
# The add-on's migration init container runs node_modules/.bin/zenstack migrate
# deploy. Fail the build if zenstack cannot load prisma itself (its fallback,
# npx, is not in this image), if prisma detects another binary target on this
# base than the installed engines, if the schema or query engine is missing or
# does not load (prisma would download one at runtime), or if the "files"
# allowlist of package.json dropped the schema or the migrations.
RUN node -e "const { createRequire } = require('node:module'); \
const prisma = createRequire(require('node:fs').realpathSync('node_modules/@zenstackhq/cli/dist/index.js')).resolve('prisma/build/index.js'); \
const enginesEntry = createRequire(prisma).resolve('@prisma/engines'); \
const engines = require(enginesEntry); \
const target = 'linux-musl-openssl-3.0.x'; \
createRequire(enginesEntry)('@prisma/get-platform').getBinaryTargetForCurrentPlatform().then((detected) => { \
  if (detected !== target) throw new Error('prisma detects ' + detected + ', the image has engines for ' + target); \
  require('node:child_process').execFileSync(require('node:path').join(engines.getEnginesPath(), 'schema-engine-' + target), ['--version'], { stdio: 'inherit' }); \
  require(require('node:path').join(engines.getEnginesPath(), 'libquery_engine-' + target + '.so.node')); \
});" \
  && test -f src/zenstack/schema.zmodel && test -d src/zenstack/migrations
EXPOSE 5000
CMD ["node", "--expose-gc", ".build/@internals/run.js"]
ARG BUILD_ID=local
ARG SOURCE_COMMIT=local
LABEL org.opencontainers.image.licenses="LGPL-3.0-or-later" \
      org.opencontainers.image.source="https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_MonoRepo" \
      org.opencontainers.image.version="build-${BUILD_ID}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}"
