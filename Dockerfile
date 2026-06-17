# syntax=docker/dockerfile:1
# Use Node.js 22 Bookworm (full build toolchain)
FROM docker.m.daocloud.io/library/node:22-bookworm

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps apps/
COPY packages packages/

# Install pnpm and all dependencies (including dev for build)
RUN npm install -g pnpm@9.15.4 \
    && pnpm install --frozen-lockfile

# Build backend using tsc (avoid nest CLI dependency)
WORKDIR /app/apps/backend
RUN pnpm exec tsc -p tsconfig.build.json

WORKDIR /app

# Switch to production dependencies only (remove dev)
RUN pnpm prune --prod

# Create non-root user
RUN useradd -m -s /bin/bash nestjs && chown -R nestjs:nestjs /app
USER nestjs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
