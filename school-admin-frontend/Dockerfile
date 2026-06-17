# =============================================================================
# Smart School Admin - Frontend Dockerfile
# Multi-stage build: node:22-alpine (build) + nginx:alpine (serve)
# =============================================================================

# Stage 1: Build
FROM docker.m.daocloud.io/library/node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build argument for API URL (default to Docker network backend hostname)
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend
RUN yarn build

# Stage 2: Serve with nginx
FROM docker.m.daocloud.io/library/nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (proxies /api to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
