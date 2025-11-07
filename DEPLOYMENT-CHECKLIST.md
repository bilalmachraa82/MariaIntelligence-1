# MariaIntelligence Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing locally: `npm test`
- [ ] TypeScript type checking passes: `npm run check`
- [ ] Linting passes without errors: `npm run lint`
- [ ] Build succeeds locally: `npm run build:render`
- [ ] No console errors or warnings in browser
- [ ] All merge conflicts resolved
- [ ] Code reviewed and approved (if team environment)

### Dependencies

- [ ] All dependencies up to date: `npm audit`
- [ ] No critical security vulnerabilities
- [ ] `package.json` and `package-lock.json` committed
- [ ] No unnecessary dependencies in `dependencies` or `devDependencies`

### Environment Variables

- [ ] All required environment variables documented
- [ ] `.env.example` is up to date
- [ ] `.env.production.example` created with production values template
- [ ] No secrets committed to Git
- [ ] `SESSION_SECRET` generated (32+ characters)
- [ ] Database connection string ready (Neon)
- [ ] Google Gemini API key obtained and tested
- [ ] Email credentials configured (if using email features)

### Database

- [ ] Database created (Neon PostgreSQL)
- [ ] Database connection string includes `?sslmode=require`
- [ ] Database migrations ready: `npm run db:push`
- [ ] Seed data prepared (if needed): `npm run db:seed`
- [ ] Database backup strategy in place
- [ ] Connection pooling configured appropriately

### Git

- [ ] All changes committed
- [ ] Working on correct branch (main/master for production)
- [ ] No uncommitted changes: `git status`
- [ ] Latest code pushed to remote: `git push`
- [ ] Git tags created for version (optional): `git tag v1.0.0`

---

## Platform-Specific Checklists

### Render Deployment

#### Initial Setup

- [ ] Render account created
- [ ] Git repository connected to Render
- [ ] `render.yaml` file committed to repository
- [ ] Free tier plan selected (or upgrade to paid)
- [ ] Region selected (closest to users)

#### Configuration

- [ ] Service type set to "Web Service"
- [ ] Environment set to "Node"
- [ ] Build command: `npm run build:render`
- [ ] Start command: `npm start`
- [ ] Health check path: `/api/health`
- [ ] Auto-deploy enabled (optional)

#### Environment Variables

- [ ] `DATABASE_URL` added
- [ ] `GOOGLE_GEMINI_API_KEY` added
- [ ] `SESSION_SECRET` generated and added
- [ ] `NODE_ENV=production` set
- [ ] Optional variables added (EMAIL_*, REDIS_URL)

#### Deployment

- [ ] Manual deploy triggered or auto-deploy on push
- [ ] Build logs reviewed for errors
- [ ] Deployment succeeded
- [ ] Health check passing
- [ ] Application accessible via Render URL

### Vercel Deployment

#### Initial Setup

- [ ] Vercel account created
- [ ] Git repository connected to Vercel
- [ ] `vercel.json` configuration committed
- [ ] Framework preset: None (or Custom)

#### Configuration

- [ ] Build command: `npm run build:vercel`
- [ ] Output directory: `dist/client`
- [ ] Install command: `npm install`
- [ ] Root directory: `.` (project root)

#### Environment Variables

- [ ] All variables added via Vercel Dashboard or CLI
- [ ] Variables set for Production environment
- [ ] `DATABASE_URL` configured
- [ ] `GOOGLE_GEMINI_API_KEY` configured
- [ ] `SESSION_SECRET` configured

#### Deployment

- [ ] Deployment triggered (automatic or manual)
- [ ] Build logs reviewed
- [ ] Function deployed successfully
- [ ] Frontend accessible
- [ ] API routes working: `/api/health`

### Docker Deployment

#### Build

- [ ] `Dockerfile` reviewed and up to date
- [ ] `.dockerignore` configured to exclude unnecessary files
- [ ] Docker image builds successfully: `docker build -t maria-intelligence .`
- [ ] Image size acceptable (< 500MB recommended)
- [ ] Multi-stage build working properly

#### Configuration

- [ ] `.env.production` file created with real values
- [ ] Environment variables not baked into image
- [ ] Health check configured in Dockerfile
- [ ] Non-root user configured for security
- [ ] Proper signal handling (dumb-init)

#### Testing

- [ ] Container runs locally: `docker run -p 5000:5000 --env-file .env.production maria-intelligence`
- [ ] Health check passes: `curl http://localhost:5000/api/health`
- [ ] Application accessible in browser
- [ ] Database connection works
- [ ] Logs visible: `docker logs maria-intelligence`

#### Production

- [ ] Image tagged properly: `docker tag maria-intelligence username/maria-intelligence:v1.0.0`
- [ ] Image pushed to registry: `docker push username/maria-intelligence:v1.0.0`
- [ ] Deployment server accessible
- [ ] Docker installed on server
- [ ] Container running with restart policy
- [ ] Reverse proxy configured (nginx/caddy)
- [ ] SSL certificate configured

#### Docker Compose

- [ ] `docker-compose.yml` reviewed
- [ ] Environment variables configured
- [ ] Volumes configured for persistence
- [ ] Networks configured
- [ ] Services start successfully: `docker-compose up -d`
- [ ] Health checks passing for all services
- [ ] Database accessible to application

---

## Post-Deployment Checklist

### Verification

- [ ] Application accessible via production URL
- [ ] Health check endpoint returns 200 OK: `/api/health`
- [ ] Frontend loads without errors
- [ ] API routes responding correctly
- [ ] Database connection working
- [ ] Static assets loading (CSS, JS, images)
- [ ] HTTPS working (SSL certificate valid)

### Functionality Testing

- [ ] User can view dashboard
- [ ] Properties can be listed and viewed
- [ ] Reservations can be created and managed
- [ ] OCR upload works (PDF processing)
- [ ] AI assistant responds to queries
- [ ] Financial reports generate correctly
- [ ] All main features working as expected

### Performance

- [ ] Page load time acceptable (< 3 seconds)
- [ ] API response times acceptable (< 500ms)
- [ ] No memory leaks observed
- [ ] CPU usage within acceptable range
- [ ] Database query performance optimized

### Security

- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configured (Helmet)
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] No sensitive data in logs
- [ ] No secrets exposed in client-side code
- [ ] Database uses SSL connection
- [ ] Environment variables secured

### Monitoring

- [ ] Health check monitoring configured
- [ ] Uptime monitoring service configured (UptimeRobot, Pingdom, etc.)
- [ ] Error tracking enabled
- [ ] Log aggregation configured
- [ ] Performance monitoring enabled
- [ ] Alerts configured for downtime
- [ ] Database monitoring active

### Database

- [ ] Migrations applied: `npm run db:migrate`
- [ ] Seed data loaded (if needed): `npm run db:seed`
- [ ] Database backup configured
- [ ] Connection pool working correctly
- [ ] No connection leaks
- [ ] Query performance acceptable

### Documentation

- [ ] Deployment documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Known issues documented
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

---

## Platform Monitoring Setup

### Render

- [ ] Dashboard alerts configured
- [ ] Health check path verified in settings
- [ ] Logs viewable in dashboard
- [ ] Auto-deploy configured (if desired)
- [ ] Custom domain configured (if using)
- [ ] SSL certificate auto-renewed

### Vercel

- [ ] Deployment notifications enabled
- [ ] Analytics enabled
- [ ] Error tracking reviewed
- [ ] Function logs accessible
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active

### Docker

- [ ] Container restart policy set
- [ ] Log rotation configured
- [ ] Resource limits set (memory, CPU)
- [ ] Health check logs reviewed
- [ ] Monitoring stack deployed (Prometheus, Grafana, etc.)
- [ ] Backup strategy for volumes

---

## Rollback Plan

### Preparation

- [ ] Previous working version tagged in Git
- [ ] Rollback procedure documented
- [ ] Database rollback strategy defined
- [ ] Downtime window communicated (if needed)

### Render Rollback

- [ ] Previous deployment available in "Events" tab
- [ ] Know how to trigger rollback via dashboard
- [ ] Test rollback in staging first

### Vercel Rollback

- [ ] Understand `vercel rollback` command
- [ ] Previous deployments accessible
- [ ] Rollback tested in preview environment

### Docker Rollback

- [ ] Previous image version available in registry
- [ ] Rollback script prepared
- [ ] Database state compatible with previous version

---

## Final Checks

### Communication

- [ ] Stakeholders notified of deployment
- [ ] Deployment time communicated
- [ ] Maintenance window announced (if needed)
- [ ] Documentation updated
- [ ] Team briefed on new features/changes

### Contingency

- [ ] Rollback plan ready
- [ ] Support team on standby
- [ ] Incident response plan ready
- [ ] Contact information accessible
- [ ] Backup deployment ready (if critical)

---

## Quick Command Reference

### Pre-Deployment

```bash
# Run all checks
npm test
npm run check
npm run lint
npm run build:render

# Verify environment
npm run verify

# Database
npm run db:push
npm run db:migrate
npm run db:seed
```

### Deployment

```bash
# Render (auto-deploys on push)
git push origin main

# Vercel CLI
vercel --prod

# Docker
docker build -t maria-intelligence .
docker run -p 5000:5000 --env-file .env.production maria-intelligence

# Docker Compose
docker-compose up -d
```

### Post-Deployment

```bash
# Test health
curl https://your-app-url/api/health

# View logs (Render/Vercel: use dashboard)
docker logs -f maria-intelligence

# Monitor
pm2 monit  # If using PM2
```

---

## Troubleshooting Quick Links

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [HEALTH-CHECKS.md](./HEALTH-CHECKS.md) - Health check documentation
- [CLAUDE.md](./CLAUDE.md) - Development guide
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs

---

**Remember**: Always test in a staging environment before deploying to production!

**Last Updated**: 2025-01-15
