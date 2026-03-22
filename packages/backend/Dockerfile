# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
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

# ── Runtime stage ─────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/packages/backend

# Run DB migrations then start server
CMD ["sh", "-c", "node -e \"require('@prisma/client')\" && npx prisma migrate deploy && node dist/server.js"]

EXPOSE 3000
