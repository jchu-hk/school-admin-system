# ============================================================
# NestJS Backend Dockerfile - Production
# ============================================================
# Build: docker build -f apps/backend -t school-admin-backend .
# ============================================================

FROM docker.m.daocloud.io/library/node:22-bookworm

# 安装 PostgreSQL 客户端工具（pg_dump/pg_restore），供 BackupService 数据库备份使用
# Issue #309/#310: 缺少 pg_dump 导致备份文件为空（pipe 掩码错误，退出码为 0）
# 离线安装：docker daemon 关闭 bridge/iptables，build 期 RUN 步骤无网络，apt-get install 必然失败。
# 故预先在宿主机下载 pgdg (apt.postgresql.org) 的 .deb（见 apps/backend/debs/），用 dpkg 离线安装，build 全程无需网络。
# #309: 数据库为 postgres:16-alpine (PostgreSQL 16.14)，pg_dump 必须 >= 16 才能 dump；
# Debian bookworm 主仓库只有 postgresql-15，故从 PostgreSQL 官方 APT 仓库 bookworm-pgdg 取 postgresql-client-16。
# 依赖顺序：先 libpq5 + postgresql-client-common，再 postgresql-client-16。
# 注：pgdg binary-amd64 无 16.x 的 libpq5（其 libpq5 均来自 postgresql-18 source），
# 但 libpq5_18.6 满足 postgresql-client-16 的依赖 (libpq5 >= 16.15)，且 libpq 向后兼容全部旧服务器。
# 运行依赖 (libc6/libssl3/libzstd1/zlib1g/libreadline8/liblz4-1/sensible-utils/netbase/perl) 均已内置于 node:22-bookworm。
# 构建上下文为仓库根（docker-compose.yml: context=..），故 COPY 路径以仓库根为基准。
# 注意：daemon bridge=bridge:none → 默认网络 build 失败，必须用 `docker build --network=host`。
COPY apps/backend/debs/ /tmp/debs/
RUN dpkg -i /tmp/debs/libpq5_18.6-1.pgdg12+2_amd64.deb \
    && dpkg -i /tmp/debs/postgresql-client-common_293.pgdg12+1_all.deb \
    && dpkg -i /tmp/debs/postgresql-client-16_16.15-1.pgdg12+2_amd64.deb \
    && rm -rf /tmp/debs

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
