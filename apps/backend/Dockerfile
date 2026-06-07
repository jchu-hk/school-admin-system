# ============================================================
# NestJS Backend Dockerfile
# Multi-stage build for optimal image size
# ============================================================

# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/backend/package.json ./apps/backend/

# ---- Dependencies Stage ----
FROM base AS deps
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

# ---- Build Stage ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter backend build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/backend/package.json ./apps/backend/

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --prod --offline && \
    cp -r node_modules /app/

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages ./packages

# Copy migration files
COPY packages/database/migrations ./migrations

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]
