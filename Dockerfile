# ── Builder ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

RUN npm install -g pnpm

# Copy workspace manifests (all packages pnpm-workspace.yaml knows about)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/engine/package.json   ./packages/engine/
COPY packages/backend/package.json  ./packages/backend/
COPY apps/web/package.json          ./apps/web/

RUN pnpm install --frozen-lockfile

# Copy sources
COPY packages/engine/  ./packages/engine/
COPY packages/backend/ ./packages/backend/

# Prisma generate must come before tsc so generated types are available
RUN cd packages/backend && pnpm exec prisma generate

# Build TypeScript
RUN cd packages/backend && pnpm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

RUN npm install -g pnpm

# Workspace metadata needed by pnpm
COPY --from=builder /app/package.json          ./
COPY --from=builder /app/pnpm-workspace.yaml   ./

# Engine (runtime dep of backend)
COPY --from=builder /app/packages/engine/      ./packages/engine/

# Backend — built artifacts + prisma schema + node_modules
COPY --from=builder /app/packages/backend/package.json  ./packages/backend/
COPY --from=builder /app/packages/backend/dist/         ./packages/backend/dist/
COPY --from=builder /app/packages/backend/prisma/       ./packages/backend/prisma/
COPY --from=builder /app/packages/backend/node_modules/ ./packages/backend/node_modules/

# Root node_modules (shared: prisma client, etc.)
COPY --from=builder /app/node_modules/ ./node_modules/

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
