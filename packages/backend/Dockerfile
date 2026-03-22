# ── Builder stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests for dependency install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/engine/ ./packages/engine/
COPY packages/backend/ ./packages/backend/

# Generate Prisma client
RUN pnpm --filter @anondoc/backend db:generate

# Build TypeScript
RUN pnpm --filter @anondoc/backend build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Production deps only
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts and Prisma files
COPY --from=builder /app/packages/backend/dist        ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma      ./packages/backend/prisma
COPY --from=builder /app/node_modules/.prisma         ./node_modules/.prisma

# Drop root privileges
USER node

WORKDIR /app/packages/backend

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "pnpm migrate:prod && node dist/server.js"]
