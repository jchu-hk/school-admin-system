FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace files (for monorepo config and hoisted node_modules)
COPY package.json package-lock.json pnpm-workspace.yaml ./
COPY node_modules ./node_modules

# Copy backend source and package files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY apps/backend/tsconfig.build.json ./apps/backend/tsconfig.build.json
COPY apps/backend/nest-cli.json ./apps/backend/nest-cli.json
COPY packages ./packages

# Install backend dependencies (devDependencies will be hoisted to root node_modules)
WORKDIR /app/apps/backend
RUN npm ci

# Build backend using TypeScript compiler from root node_modules
WORKDIR /app
RUN node node_modules/typescript/bin/tsc -p apps/backend/tsconfig.build.json

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
