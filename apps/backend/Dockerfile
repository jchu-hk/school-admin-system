# ============================================================
# NestJS Backend Dockerfile - Production
# ============================================================
# Build: docker build -f apps/backend -t school-admin-backend .
# ============================================================

FROM node:22-bookworm

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages/
COPY apps apps/

# Install pnpm and ALL dependencies (including devDeps for build)
RUN npm install -g pnpm@9.15.4 \
    && pnpm install

# Build TypeScript
WORKDIR /app/apps/backend
RUN pnpm exec tsc -p tsconfig.build.json

WORKDIR /app

# Prune devDependencies for production
RUN pnpm prune --prod || true

# Create non-root user
RUN useradd -m -s /bin/bash nestjs && chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
