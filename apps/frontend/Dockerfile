# =============================================================================
# Smart School Admin - Frontend Placeholder
# =============================================================================
# This is a placeholder Dockerfile. Replace with actual frontend build steps.
# 
# Expected structure when frontend is ready:
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --legacy-peer-deps
# COPY . .
# RUN npm run build
#
# FROM nginx:alpine
# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
# =============================================================================

FROM nginx:alpine
LABEL maintainer="school-admin-dev"
LABEL description="Smart School Admin Frontend (placeholder)"

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Create a simple placeholder page
RUN echo '<!DOCTYPE html><html><head><title>Smart School Admin</title>' \
    '<style>body{font-family:sans-serif;display:flex;justify-content:center;' \
    'align-items:center;height:100vh;margin:0;background:#f5f5f5}' \
    '.card{background:#fff;padding:40px;border-radius:8px;' \
    'box-shadow:0 2px 10px rgba(0,0,0,.1);text-align:center}' \
    'h1{color:#333;margin-bottom:10px}' \
    'p{color:#666}</style></head><body>' \
    '<div class="card"><h1>🏫 Smart School Admin</h1>' \
    '<p>Frontend placeholder — replace with actual build</p></div></body></html>' \
    > /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
