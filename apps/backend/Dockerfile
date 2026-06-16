# ============================================================
# NestJS Backend Dockerfile - Simplified
# ============================================================
# Build: docker build -f apps/backend/Dockerfile -t school-admin-backend .
# ============================================================

FROM node:22-bookworm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages/
COPY apps apps/

# Install pnpm and dependencies (--prod = no devDeps)
RUN npm install -g pnpm@9.15.4 \
    && pnpm install --frozen-lockfile --prod

# Build
RUN pnpm --filter @school-admin/backend build

# Create non-root user
RUN useradd -m -s /bin/bash nestjs && chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
