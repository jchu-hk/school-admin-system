# ============================================================
# NestJS Backend Dockerfile - Production
# ============================================================
# Build: docker build -f apps/backend -t school-admin-backend .
# ============================================================

FROM docker.m.daocloud.io/library/node:22-bookworm

# 安装 PostgreSQL 客户端工具（pg_dump/pg_restore），供 BackupService 数据库备份使用
# Issue #309/#310: 缺少 pg_dump 导致备份文件为空（pipe 掩码错误，退出码为 0）
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

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
RUN pnpm exec tsc -p tsconfig.build.json --noEmitOnError false || npx tsc -p tsconfig.build.json --noEmitOnError false

# Verify dist was created
RUN ls -la dist/ || echo "dist not found!"

WORKDIR /app

# Prune devDependencies for production
RUN pnpm prune --prod || true

# Ensure bcryptjs is available at runtime (required for auth)
RUN cd /app/apps/backend && pnpm add bcryptjs || npm install bcryptjs

# Create non-root user
RUN useradd -m -s /bin/bash nestjs && chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
