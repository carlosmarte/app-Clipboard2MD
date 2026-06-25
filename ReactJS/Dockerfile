# --- Build stage: compile the React bundle ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies (cached unless lockfile changes)
COPY package*.json ./
# Resolve against the host's Verdaccio mirror. Inside the build container
# `localhost` is the container itself, so we reach the host registry via
# `host.docker.internal` (provided automatically by Docker Desktop). The
# lockfile pins `resolved` tarball URLs to localhost:4873, so
# `--replace-registry-host=always` rewrites them to the registry above —
# without it npm hangs ~70s and (on npm 10.x) crashes while exiting 0.
RUN npm ci --include=dev \
      --registry=http://host.docker.internal:4873 \
      --replace-registry-host=always

# Build the production bundle
COPY . .
RUN npm run build

# --- Runtime stage: Node server + SQLite ---
FROM node:20-alpine AS serve
WORKDIR /app
ENV NODE_ENV=production \
    PORT=60001 \
    DB_PATH=/data/clipboard2md.db

# better-sqlite3 is a native addon; building it from source needs a toolchain.
# Install build deps, compile prod dependencies, then drop the toolchain to
# keep the final image small.
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm ci --omit=dev \
       --registry=http://host.docker.internal:4873 \
       --replace-registry-host=always \
    && apk del .build-deps \
    && npm cache clean --force

# App code + built frontend
COPY server ./server
COPY --from=build /app/dist ./dist

# Persisted SQLite database lives on a mounted volume.
VOLUME ["/data"]
EXPOSE 60001
CMD ["node", "server/index.js"]
