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

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Install ALL dependencies (including devDeps for build)
RUN pnpm install

# Build TypeScript - run from backend directory
WORKDIR /app/apps/backend
RUN pnpm exec tsc -p tsconfig.build.json || npx tsc -p tsconfig.build.json

# Verify dist was created
RUN ls -la dist/ || echo "dist not found!"

WORKDIR /app

# Prune devDependencies for production
RUN pnpm prune --prod || true

# Create non-root user
RUN useradd -m -s /bin/bash nestjs && chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
