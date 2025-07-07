# Deployment Guide

This guide covers deploying Sri's Portfolio to various platforms.

## Table of Contents

- [Vercel (Recommended)](#vercel-recommended)
- [Netlify](#netlify)
- [Docker Deployment](#docker-deployment)
- [Manual Server Deployment](#manual-server-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Domain Configuration](#domain-configuration)
- [SSL Certificate](#ssl-certificate)
- [Monitoring and Analytics](#monitoring-and-analytics)

## Vercel (Recommended)

Vercel is the recommended deployment platform as it's optimized for Next.js applications.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsbeeredd04%2Fsri-s_portfolio)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   cd sri_portfolio/sri_portfolio
   vercel
   ```

4. **Follow the prompts**
   - Set up project name
   - Configure framework preset (Next.js)
   - Set root directory

### Vercel Configuration

Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key",
    "PINECONE_API_KEY": "@pinecone-api-key",
    "PINECONE_ENVIRONMENT": "@pinecone-environment",
    "PINECONE_INDEX_NAME": "@pinecone-index-name"
  }
}
```

### Environment Variables on Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GEMINI_API_KEY` | Your Gemini API key | Production, Preview |
| `PINECONE_API_KEY` | Your Pinecone API key | Production, Preview |
| `PINECONE_ENVIRONMENT` | Your Pinecone environment | Production, Preview |
| `PINECONE_INDEX_NAME` | Your Pinecone index name | Production, Preview |

## Netlify

### Deploy from Git

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: `sri_portfolio/sri_portfolio`

3. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all required environment variables

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  base = "sri_portfolio/sri_portfolio"
  publish = ".next"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY sri_portfolio/sri_portfolio/package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY sri_portfolio/sri_portfolio/package*.json ./
RUN npm ci
COPY sri_portfolio/sri_portfolio/ .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  portfolio:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - PINECONE_API_KEY=${PINECONE_API_KEY}
      - PINECONE_ENVIRONMENT=${PINECONE_ENVIRONMENT}
      - PINECONE_INDEX_NAME=${PINECONE_INDEX_NAME}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - portfolio
    restart: unless-stopped
```

### Build and Run

```bash
# Build the image
docker build -t sri-portfolio .

# Run the container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e PINECONE_API_KEY=your_key \
  -e PINECONE_ENVIRONMENT=your_env \
  -e PINECONE_INDEX_NAME=your_index \
  sri-portfolio

# Or use Docker Compose
docker-compose up -d
```

## Manual Server Deployment

### Prerequisites

- Node.js 18+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- SSL Certificate

### Setup Process

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone and Build**
   ```bash
   git clone https://github.com/sbeeredd04/sri-s_portfolio.git
   cd sri-s_portfolio/sri_portfolio/sri_portfolio
   npm install
   npm run build
   ```

4. **Create PM2 Configuration**
   
   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'sri-portfolio',
       script: 'npm',
       args: 'start',
       cwd: '/path/to/sri_portfolio/sri_portfolio',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         GEMINI_API_KEY: 'your_key',
         PINECONE_API_KEY: 'your_key',
         PINECONE_ENVIRONMENT: 'your_env',
         PINECONE_INDEX_NAME: 'your_index'
       }
     }]
   };
   ```

5. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

### Nginx Configuration

Create `/etc/nginx/sites-available/sri-portfolio`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sri-portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyD...` |
| `PINECONE_API_KEY` | Pinecone API key | `12345678-1234-1234-1234-123456789012` |
| `PINECONE_ENVIRONMENT` | Pinecone environment | `us-east-1-gcp` |
| `PINECONE_INDEX_NAME` | Pinecone index name | `sri-portfolio-index` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `EMAILJS_SERVICE_ID` | EmailJS service ID | - |
| `EMAILJS_TEMPLATE_ID` | EmailJS template ID | - |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key | - |

## Database Setup

### Pinecone Vector Database

1. **Create Account**
   - Go to [Pinecone](https://www.pinecone.io/)
   - Create an account and get API key

2. **Create Index**
   ```bash
   curl -X POST "https://api.pinecone.io/databases" \
     -H "Api-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "sri-portfolio-index",
       "dimension": 1536,
       "metric": "cosine"
     }'
   ```

3. **Initialize Embeddings**
   - The application will automatically initialize embeddings on first run
   - Check logs for initialization status

## Domain Configuration

### DNS Settings

Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | Your server IP |
| A | www | Your server IP |
| CNAME | www | yourdomain.com |

### Subdomain Setup

For subdomains like `portfolio.yourdomain.com`:

| Type | Name | Value |
|------|------|-------|
| CNAME | portfolio | yourdomain.com |

## SSL Certificate

### Using Let's Encrypt (Recommended)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Custom Certificate

If you have a custom SSL certificate:

1. Copy certificate files to `/etc/nginx/ssl/`
2. Update Nginx configuration with correct paths
3. Restart Nginx

## Monitoring and Analytics

### Application Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs sri-portfolio
   ```

2. **System Monitoring**
   ```bash
   htop
   df -h
   free -h
   ```

### Analytics Setup

1. **Vercel Analytics**
   - Automatically enabled on Vercel
   - Configure in Vercel dashboard

2. **Google Analytics**
   - Add tracking ID to environment variables
   - Configure in application settings

### Performance Monitoring

1. **Lighthouse CI**
   ```bash
   npm install -g @lhci/cli
   lhci autorun
   ```

2. **Web Vitals**
   - Enabled by default with Vercel Speed Insights
   - Monitor Core Web Vitals metrics

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+ required)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **API Errors**
   - Verify environment variables are set
   - Check API key validity
   - Monitor API rate limits

3. **Performance Issues**
   - Enable gzip compression
   - Optimize images
   - Use CDN for static assets

### Health Checks

Create a health check endpoint:

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
```

Monitor with:
```bash
curl https://yourdomain.com/api/health
```

## Support

For deployment support:
- Check the main README troubleshooting section
- Create an issue on GitHub
- Contact: srisubspace@gmail.com