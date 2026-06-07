# Public Internet Access Deployment Guide

## Overview

This document describes the public internet access configuration for the Smart School Admin System using Docker and Nginx reverse proxy.

## Architecture

```
Internet → Nginx (Port 80) → Frontend (Static) / Backend API (/api)
                               ↓
                         Docker Internal Network
```

### Components

1. **Nginx Reverse Proxy** (Port 80)
   - Public access entry point
   - Static file serving for frontend
   - API reverse proxy to backend
   - Rate limiting and security headers

2. **Frontend** (Internal Network)
   - React application
   - Static files served by Nginx
   - API calls routed through Nginx

3. **Backend** (Internal Network)
   - NestJS API
   - JWT authentication
   - CORS configuration

4. **Supporting Services**
   - PostgreSQL (Internal only - no public access)
   - Redis (Internal only - no public access)
   - Grafana (Optional - port 3001)

## Port Mapping

| Service | Container Port | Host Binding | Public Access |
|---------|---------------|--------------|---------------|
| Nginx | 80 | 0.0.0.0:80 | ✅ Yes |
| Frontend | 80 | Internal only | ❌ No |
| Backend | 3000 | 0.0.0.0:3000 | ⚠️  Dev only |
| PostgreSQL | 5432 | Internal only | ❌ No |
| Redis | 6379 | Internal only | ❌ No |
| Grafana | 3000 | 0.0.0.0:3001 | ⚠️  VPN only |

## Security Configuration

### 1. Nginx Security Headers

- **X-Frame-Options**: `SAMEORIGIN` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **X-XSS-Protection**: `1; mode=block` - XSS protection
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer info
- **Server Tokens**: Off - Hides Nginx version

### 2. Rate Limiting

- **API endpoints**: 10 requests/second (burst 20)
- **General requests**: 30 requests/second (burst 50)

### 3. CORS Configuration

Configure allowed origins in `.env.docker`:

```bash
CORS_ORIGINS=http://your-domain.com,https://your-domain.com
```

### 4. Backend Security

- All API endpoints require JWT authentication
- CORS is enforced based on environment configuration
- Database is not exposed to public internet

## Environment Variables

Update `.env.docker` with your public configuration:

```bash
# Public domain
PUBLIC_DOMAIN=your-domain.com

# CORS allowed origins
CORS_ORIGINS=http://your-domain.com,https://your-domain.com

# Frontend API URL (relative to domain)
FRONTEND_API_URL=/api
```

## Deployment Steps

### 1. Build and Start Services

```bash
cd /workspace/projects/workspace
docker-compose -f infra/docker-compose.yml build
docker-compose -f infra/docker-compose.yml up -d
```

### 2. Verify Services

```bash
# Check all services are running
docker-compose ps

# Check Nginx logs
docker-compose logs -f nginx

# Check health endpoints
curl http://localhost/health
```

### 3. Access Applications

- **Frontend**: `http://your-domain.com`
- **API**: `http://your-domain.com/api`
- **API Docs**: `http://your-domain.com/api/docs` (internal access)
- **Grafana**: `http://your-server-ip:3001` (VPN only)

## SSL/HTTPS Configuration (Optional)

For production, add SSL/TLS:

### Option 1: Let's Encrypt (Certbot)

```bash
# Install certbot
apt-get install certbot

# Generate certificate
certbot certonly --standalone -d your-domain.com

# Update nginx.conf to use SSL
```

### Option 2: CloudFlare SSL

1. Point domain to CloudFlare
2. Enable "Flexible SSL" mode
3. Keep Nginx on port 80
4. CloudFlare handles HTTPS

## Monitoring and Logs

### View Nginx Access Logs

```bash
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

### View Nginx Error Logs

```bash
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

### View Application Logs

```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Backend service not responding

**Solution**:
```bash
docker-compose ps backend
docker-compose logs backend
```

### Issue: CORS Errors

**Cause**: Origin not in CORS allowlist

**Solution**:
1. Check `.env.docker` CORS_ORIGINS setting
2. Restart backend: `docker-compose restart backend`

### Issue: Frontend Not Loading

**Cause**: Frontend build failed or static files not available

**Solution**:
```bash
docker-compose logs frontend
docker-compose restart frontend
```

## Security Checklist

Before going public, ensure:

- [ ] Change all default passwords in `.env.docker`
- [ ] Update `JWT_SECRET` with a strong, unique value
- [ ] Set up CORS_ORIGINS with your actual domain
- [ ] Configure SSL/HTTPS for production
- [ ] Enable firewall rules (see below)
- [ ] Set up monitoring and alerting
- [ ] Backup strategy in place
- [ ] Review and test rate limiting
- [ ] Disable Swagger docs in production (optional)

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
# Allow HTTP (port 80)
ufw allow 80/tcp

# Allow HTTPS (if using SSL)
ufw allow 443/tcp

# Allow Grafana (VPN access only)
ufw allow from YOUR_VPN_IP to any port 3001

# Deny everything else
ufw default deny incoming
ufw default allow outgoing

# Enable firewall
ufw enable
```

### iptables

```bash
# Allow HTTP
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Allow HTTPS (if using SSL)
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow Grafana (VPN only)
iptables -A INPUT -s YOUR_VPN_IP -p tcp --dport 3001 -j ACCEPT

# Default deny
iptables -P INPUT DROP
```

## Performance Optimization

### Nginx Tuning

Edit `infra/nginx/nginx.conf`:

```nginx
# Increase worker connections
events {
    worker_connections 2048;
}

# Enable connection keepalive
keepalive_timeout 65;
keepalive_requests 100;
```

### Caching Strategy

Static assets are cached for 1 year with `immutable` flag. Update cache-busting by changing file versions during builds.

## Backup Strategy

1. **Database Backups**:
   ```bash
   docker-compose exec postgres pg_dump -U school_admin school_admin > backup.sql
   ```

2. **Volume Backups**:
   ```bash
   docker run --rm -v school-admin-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
   ```

3. **Configuration Backups**:
   ```bash
   tar czf config-backup.tar.gz infra/ .env.docker
   ```

## Contact

For deployment issues or questions, contact the DevOps team.

---

**Last Updated**: 2026-06-07
**Version**: 1.0
**Status**: ✅ Ready for Production