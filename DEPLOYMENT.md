# MariaIntelligence Deployment Guide

Complete deployment guide for all supported platforms: Render, Vercel, Docker, and manual deployment.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [1. Render (Recommended for Full-Stack)](#1-render-recommended-for-full-stack)
  - [2. Vercel (Serverless)](#2-vercel-serverless)
  - [3. Docker](#3-docker)
  - [4. Manual Deployment](#4-manual-deployment)
- [Health Checks](#health-checks)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js** 20+ installed
- **PostgreSQL** database (Neon recommended)
- **Google Gemini API Key** (for AI/OCR features)
- Git repository access
- Platform account (Render/Vercel/Docker Hub)

---

## Environment Variables

All deployments require these environment variables:

### Required Variables

```bash
# Database (Neon PostgreSQL recommended)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Session Security
SESSION_SECRET=your_secure_random_secret_here_minimum_32_chars

# Node Environment
NODE_ENV=production
```

### Optional Variables

```bash
# AI/OCR Features (highly recommended)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Redis (for session storage, optional)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

### Generating Session Secret

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment Options

### 1. Render (Recommended for Full-Stack)

Render is the recommended platform for full-stack deployment with automatic SSL, continuous deployment, and easy scaling.

#### Option A: Using `render.yaml` (Infrastructure as Code)

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will automatically detect `render.yaml`

2. **Configure Environment Variables**
   - In Render Dashboard, go to your service
   - Navigate to "Environment" tab
   - Add required environment variables:
     - `DATABASE_URL` (your Neon connection string)
     - `GOOGLE_GEMINI_API_KEY`
     - `SESSION_SECRET` (auto-generated or custom)

3. **Deploy**
   - Click "Apply" to deploy
   - Render will build and deploy automatically
   - Check health endpoint: `https://your-app.onrender.com/api/health`

#### Option B: Manual Render Setup

1. **Create Web Service**
   - New + → Web Service
   - Connect your repository
   - Configure:
     - **Name**: maria-intelligence
     - **Environment**: Node
     - **Region**: Oregon (or closest to your users)
     - **Branch**: main
     - **Build Command**: `npm run build:render`
     - **Start Command**: `npm start`
     - **Plan**: Starter (free) or Standard

2. **Environment Variables**
   - Add all required variables in "Environment" tab

3. **Health Check**
   - Path: `/api/health`
   - Initial delay: 30 seconds

4. **Persistent Disk** (Optional for uploads)
   - Add disk: `/app/uploads`
   - Size: 1GB

#### Render Deployment Commands

```bash
# The following happens automatically on Render:
npm install                 # Install dependencies
npm run build:render        # Build frontend + backend
npm start                   # Start production server
```

#### Render Build Output

- **Frontend**: Built to `dist/client` (static files)
- **Backend**: Bundled to `dist/server/index.js`
- **Entry Point**: `npm start` runs `node dist/server/index.js`

---

### 2. Vercel (Serverless)

Vercel is great for frontend-first deployments with serverless backend functions.

#### Deployment Steps

1. **Install Vercel CLI** (Optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import Git repository
   - Vercel will auto-detect `vercel.json`
   - Configure environment variables

3. **Deploy via CLI**
   ```bash
   # Login to Vercel
   vercel login

   # Deploy (preview)
   vercel

   # Deploy to production
   vercel --prod
   ```

4. **Environment Variables**
   - Add via Vercel Dashboard or CLI:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add GOOGLE_GEMINI_API_KEY production
   vercel env add SESSION_SECRET production
   ```

#### Vercel Configuration

The `vercel.json` file is pre-configured:

- **Frontend**: Static build to `dist/client`
- **Backend**: Serverless function at `/api`
- **Routing**: All `/api/*` routes to backend function
- **SPA Routing**: All other routes serve `index.html`

#### Build Commands

```bash
npm run build:vercel        # Builds both frontend and backend
```

#### Vercel Limitations

- **Serverless Functions**: 10-second timeout (hobby), 30-second (paid)
- **Cold Starts**: May have initial latency
- **Stateless**: No persistent file storage
- **Database**: Must use external database (Neon)

---

### 3. Docker

Deploy using Docker for maximum control and portability.

#### Quick Start

1. **Build Image**
   ```bash
   docker build -t maria-intelligence .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 5000:5000 \
     --name maria-intelligence \
     --env-file .env \
     maria-intelligence
   ```

3. **Check Logs**
   ```bash
   docker logs -f maria-intelligence
   ```

4. **Stop Container**
   ```bash
   docker stop maria-intelligence
   docker rm maria-intelligence
   ```

#### Docker Compose (Recommended for Local Testing)

1. **Create `.env` file** with all environment variables

2. **Start All Services**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - MariaIntelligence app (port 5000)
   - PostgreSQL database (port 5432)
   - Redis (port 6379)

3. **View Logs**
   ```bash
   docker-compose logs -f app
   ```

4. **Stop All Services**
   ```bash
   docker-compose down
   ```

5. **Clean Up** (including volumes)
   ```bash
   docker-compose down -v
   ```

#### Production Docker Deployment

1. **Build and Tag**
   ```bash
   docker build -t your-dockerhub-username/maria-intelligence:latest .
   ```

2. **Push to Registry**
   ```bash
   docker login
   docker push your-dockerhub-username/maria-intelligence:latest
   ```

3. **Deploy on Server**
   ```bash
   # Pull image
   docker pull your-dockerhub-username/maria-intelligence:latest

   # Run with restart policy
   docker run -d \
     --restart unless-stopped \
     -p 5000:5000 \
     --env-file .env.production \
     --name maria-intelligence \
     your-dockerhub-username/maria-intelligence:latest
   ```

#### Docker Features

- **Multi-stage Build**: Optimized for size (dependencies → builder → production)
- **Non-root User**: Runs as `nodejs` user for security
- **Health Check**: Built-in Docker health check for `/api/health`
- **Signal Handling**: Proper shutdown with `dumb-init`
- **Alpine Linux**: Small base image (~150MB total)

---

### 4. Manual Deployment

Deploy to any Linux server with Node.js.

#### Server Requirements

- Ubuntu 20.04+ or similar
- Node.js 20+
- PostgreSQL (or use Neon)
- Nginx (for reverse proxy)
- PM2 (for process management)

#### Deployment Steps

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/MariaIntelligence.git
   cd MariaIntelligence
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   # Add all required environment variables
   ```

5. **Build Application**
   ```bash
   npm run build:render
   ```

6. **Start with PM2**
   ```bash
   # Start application
   pm2 start npm --name "maria-intelligence" -- start

   # Or use the production script
   pm2 start start-server.js --name "maria-intelligence"

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on boot
   pm2 startup systemd
   # Run the command PM2 outputs
   ```

7. **Configure Nginx** (Optional but recommended)

   Create `/etc/nginx/sites-available/maria-intelligence`:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # Health check endpoint
       location /api/health {
           proxy_pass http://localhost:5000/api/health;
           access_log off;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/maria-intelligence /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Setup SSL** (Let's Encrypt)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

#### PM2 Management

```bash
# View logs
pm2 logs maria-intelligence

# Monitor
pm2 monit

# Restart
pm2 restart maria-intelligence

# Stop
pm2 stop maria-intelligence

# View status
pm2 status

# View detailed info
pm2 show maria-intelligence
```

---

## Health Checks

The application provides a health check endpoint for monitoring.

### Health Check Endpoint

**URL**: `/api/health`

**Method**: `GET`

**Response** (200 OK):
```json
{
  "status": "ok",
  "time": "2025-01-15T10:30:00.000Z"
}
```

### Testing Health Check

```bash
# Local
curl http://localhost:5000/api/health

# Production
curl https://your-app.onrender.com/api/health
```

### Platform-Specific Health Checks

#### Render
- **Path**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Initial Delay**: 30 seconds

#### Docker
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 40 seconds
- **Retries**: 3

#### Vercel
- Health checks handled automatically by platform

---

## Database Setup

### Using Neon (Recommended)

1. **Create Neon Project**
   - Go to [Neon Console](https://console.neon.tech/)
   - Create new project
   - Select region closest to your deployment
   - Copy connection string

2. **Configure Connection**
   ```bash
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
   ```

3. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

4. **Seed Data** (Optional)
   ```bash
   npm run db:seed
   ```

### Connection Pooling

The app uses connection pooling for optimal performance:
- **Production**: 25 connections
- **Development**: 8 connections

Configure in `server/db/index.ts` if needed.

---

## Post-Deployment

### Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-app-url/api/health
   ```

2. **Test Frontend**
   - Open browser to `https://your-app-url`
   - Verify dashboard loads

3. **Test API**
   ```bash
   curl https://your-app-url/api/v1/properties
   ```

4. **Check Logs**
   - Render: View in dashboard
   - Vercel: Check Functions logs
   - Docker: `docker logs maria-intelligence`
   - PM2: `pm2 logs maria-intelligence`

### Initial Setup

1. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

2. **Seed Sample Data** (Optional)
   ```bash
   npm run db:seed
   ```

3. **Verify AI Features**
   - Test OCR upload: `/api/ocr`
   - Test AI assistant: `/api/assistant`

---

## Monitoring

### Application Monitoring

#### Render
- Built-in metrics dashboard
- View CPU, memory, and bandwidth usage
- Set up alerts for downtime

#### Vercel
- Built-in analytics
- Function execution metrics
- Error tracking in dashboard

#### Docker/Manual
- **PM2 Monitoring**:
  ```bash
  pm2 monit
  ```

- **PM2 Plus** (optional paid service):
  ```bash
  pm2 link [secret_key] [public_key]
  ```

### Log Monitoring

- **Render**: View in dashboard or use Render logs CLI
- **Vercel**: Real-time logs in dashboard
- **Docker**: `docker logs -f maria-intelligence`
- **PM2**: `pm2 logs maria-intelligence --lines 100`

### Database Monitoring

- **Neon Console**: View query performance, storage, connections
- **Application Logs**: Database errors logged by Pino

---

## Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Symptoms**: Build succeeds but server crashes on startup

**Solutions**:
```bash
# Check environment variables
npm run verify

# Check build output
ls -la dist/server/

# Check logs for specific error
# Render: View logs in dashboard
# Docker: docker logs maria-intelligence
# PM2: pm2 logs maria-intelligence
```

**Common Causes**:
- Missing `DATABASE_URL`
- Missing `SESSION_SECRET`
- Database connection failure
- Incorrect build output location

#### 2. Database Connection Errors

**Symptoms**: `Error: Connection terminated` or `ECONNREFUSED`

**Solutions**:
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection
npm run db:push

# Check Neon database status
# Visit Neon Console
```

**Database URL Format**:
```
postgresql://user:password@host:5432/database?sslmode=require
```

#### 3. Build Failures

**Symptoms**: Build fails during deployment

**Solutions**:
```bash
# Clear build cache
rm -rf node_modules dist package-lock.json
npm install
npm run build:render

# Check for TypeScript errors
npm run check

# Verify all files are committed
git status
```

#### 4. API Routes Not Working

**Symptoms**: 404 errors on `/api/*` routes

**Solutions**:

**Render**:
- Ensure `build:render` script ran successfully
- Check that `dist/server/index.js` exists

**Vercel**:
- Verify `api/index.js` exists
- Check `vercel.json` rewrites configuration
- Ensure serverless function limits not exceeded

**Docker**:
- Check if server started successfully
- View logs: `docker logs maria-intelligence`

#### 5. Environment Variables Not Loading

**Symptoms**: Features fail with "API key missing" or similar

**Solutions**:

**Render**:
- Check "Environment" tab in dashboard
- Ensure variables are saved
- Re-deploy after adding variables

**Vercel**:
- Add variables via dashboard or CLI
- Re-deploy after adding variables

**Docker**:
- Check `.env` file exists and is properly formatted
- Use `--env-file` flag when running container
- Verify variables with: `docker exec maria-intelligence env`

#### 6. Health Check Failures

**Symptoms**: Health check endpoint returns errors or times out

**Solutions**:
```bash
# Test health check locally
curl http://localhost:5000/api/health

# Check server logs for errors
# Ensure PORT environment variable matches health check
# Default is 5000

# Verify server is binding to correct host
# Should be 0.0.0.0, not 127.0.0.1
```

#### 7. OCR/AI Features Not Working

**Symptoms**: OCR uploads fail or AI assistant doesn't respond

**Solutions**:
- Verify `GOOGLE_GEMINI_API_KEY` is set
- Check API key quota in [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check rate limiting (10 req/hour for OCR)
- View server logs for specific Gemini API errors

#### 8. Memory Issues (Render/Docker)

**Symptoms**: Server crashes with "out of memory" errors

**Solutions**:

**Render**:
- Upgrade to Standard plan (512MB RAM minimum)
- Optimize connection pool size in `server/db/index.ts`

**Docker**:
- Increase container memory limit
- Check for memory leaks in logs

---

## Security Best Practices

### Production Checklist

- ✅ **HTTPS Only**: Enable SSL/TLS (automatic on Render/Vercel)
- ✅ **Environment Variables**: Never commit secrets to Git
- ✅ **Database SSL**: Use `?sslmode=require` in DATABASE_URL
- ✅ **Session Secret**: Use strong random secret (32+ chars)
- ✅ **Rate Limiting**: Configured (100 req/15min general, 10 req/hour OCR)
- ✅ **Helmet Security Headers**: Enabled in `server/middleware/security.ts`
- ✅ **CORS**: Configured for frontend domain
- ✅ **Input Validation**: Zod schemas on all endpoints
- ✅ **Logging**: Pino with sensitive data redaction

### Regular Maintenance

- **Update Dependencies**: `npm audit fix` monthly
- **Review Logs**: Check for errors and unusual activity
- **Database Backups**: Neon provides automatic backups
- **Monitor API Usage**: Check Gemini API quota usage
- **Test Deployments**: Use preview/staging environments

---

## Scaling

### Horizontal Scaling (Render)

```yaml
# In render.yaml, add:
numInstances: 2
```

### Vertical Scaling

- **Render**: Upgrade to Pro plan (2GB RAM, 2 CPUs)
- **Docker**: Increase container resources
- **Manual**: Upgrade server instance

### Database Scaling

- **Neon**: Auto-scales to handle connections
- **Connection Pooling**: Already configured (25 connections in prod)

---

## Rollback Procedures

### Render
- Go to "Events" tab in dashboard
- Click "Rollback" on previous successful deploy

### Vercel
```bash
vercel rollback
```

### Docker
```bash
# Pull previous version
docker pull your-username/maria-intelligence:previous-tag
docker stop maria-intelligence
docker rm maria-intelligence
docker run -d ... maria-intelligence:previous-tag
```

### PM2
```bash
# If you saved previous version
git checkout previous-commit
npm run build:render
pm2 restart maria-intelligence
```

---

## Support

- **Documentation**: See `/home/user/MariaIntelligence-1/CLAUDE.md`
- **Issues**: GitHub Issues
- **Logs**: Check platform-specific logging (see Monitoring section)

---

## Deployment Summary

| Platform | Best For | Pros | Cons |
|----------|----------|------|------|
| **Render** | Full-stack production | Easy setup, auto-scaling, free SSL | Cold starts on free tier |
| **Vercel** | Frontend-heavy apps | Great DX, fast deploys | Serverless limitations |
| **Docker** | Complete control | Portable, consistent | Manual management |
| **Manual** | Custom infrastructure | Full control, optimization | Complex setup |

**Recommended**: Start with Render for production, use Docker for local testing.

---

**Last Updated**: 2025-01-15
**MariaIntelligence Version**: 1.0.0
