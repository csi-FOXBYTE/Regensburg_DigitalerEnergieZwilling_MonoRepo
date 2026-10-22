FROM node:24.22.1-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git curl ca-certificates openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.22.0
WORKDIR /workspace
USER node
CMD ["sleep", "infinity"]
