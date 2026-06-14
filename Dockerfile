# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build backend
RUN pnpm --filter @school-admin/backend build

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start backend
CMD ["node", "apps/backend/dist/main.js"]