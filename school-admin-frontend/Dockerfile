# =============================================================================
# Smart School Admin - Frontend Dockerfile
# Multi-stage build: node:22-alpine (build) + nginx:alpine (serve)
# =============================================================================
# 
# Version info is auto-generated during build:
# - Version: from package.json
# - Git commit/branch: from build args (passed by CI/CD)
# - Changelog: from recent git commits (or fallback)
#
# Build with:
#   docker build --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
#                --build-arg GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD) \
#                -t frontend:latest .
# =============================================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for version info (passed by CI/CD)
ARG GIT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG VITE_API_URL=http://localhost:3000/api

# Set environment variables
ENV GIT_COMMIT=$GIT_COMMIT
ENV GIT_BRANCH=$GIT_BRANCH
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including tsx for version generation)
RUN npm ci

# Copy source code (including scripts/)
COPY . .

# Generate version.json from package.json + build args
RUN npm run generate-version

# Build the frontend (version.json will be copied to dist/)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder (includes version.json)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (proxies /api to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]