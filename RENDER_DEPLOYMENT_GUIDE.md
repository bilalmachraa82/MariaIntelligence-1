# Render Deployment Guide - Maria Intelligence

This guide explains how to run the complete Maria Intelligence stack (web app, API, managed Postgres and Redis) on Render using the infrastructure-as-code blueprint introduced in `.render.yaml`.

## 📋 Status: READY TO DEPLOY ✅

A configura\u00e7\u00e3o foi completada e testada com sucesso. O projeto est\u00e1 pronto para deployment no Render.

## 1. Prerequisites
- Render account with access to the Blueprint (Infrastructure as Code) feature.
- Access to the Git repository that contains this project.
- Production credentials for:
  - `GOOGLE_GEMINI_API_KEY`
  - `SESSION_SECRET`
  - Optional SMTP provider (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
- (Optional) Custom domain and TLS certificate information if you plan to attach a domain to the web service.

## 2. Repository Preparation
- Commit the updated `vite.config.ts` (ensures the React build is emitted to `dist/public`).
- Commit `.render.yaml` so Render can read the infrastructure definition.
- Verify that `npm run build:render` and `npm run db:migrate` succeed locally; Render will call both commands during deploy.
- Clean up `dist/` before committing—Render will generate its own build artefacts.

## 3. Blueprint Overview (`.render.yaml`)
The blueprint provisions three resources in the Frankfurt region (update the region/plan as needed):

1. **`mariafaz-web` (type: `web`)**
   - Environment: Node 20 runtime.
   - Build command: `npm install --legacy-peer-deps && npm run build:render`.
   - Start command: `npm run start` (runs the bundled Express server that serves both API and static client from `dist/public`).
   - Health check: `GET /api/health`.
   - Post-deploy: `npm run db:migrate` (applies Drizzle migrations).
   - Environment variables:
     - `NODE_ENV=production` (hard-coded).
     - `DATABASE_URL` pulled from the managed Postgres instance.
     - `REDIS_URL` pulled from the managed Redis instance.
     - Secrets (`SESSION_SECRET`, `GOOGLE_GEMINI_API_KEY`, email settings) flagged with `sync: false` so you must set them manually in the Render dashboard after the first deploy.

2. **`mariafaz-redis` (type: `redis`)**
   - Free/Starter Redis instance for BullMQ queues and session storage.
   - `REDIS_URL` is automatically linked to the web service.

3. **`mariafaz-db` (managed Postgres)**
   - Starter Postgres database connected to the web service via `DATABASE_URL`.
   - Credentials (`databaseName`, `user`) can be customised to match existing data.

> **Note:** If you prefer to keep the existing Neon database, remove the `databases` block and replace the `DATABASE_URL` entry with `sync: false`, then populate the Neon connection string manually.

## 4. Deploying via Blueprint
1. Push the changes to the default branch referenced in `.render.yaml` (currently `main`).
2. In Render, choose **New > Blueprint** and select the repository.
3. Review the generated resources and adjust plans/regions if required.
4. Provide initial values for unsynchronised env vars (Render will prompt you).
5. Launch the blueprint. Render will:
   - Install dependencies and build the project.
   - Run database migrations (post deploy command).
   - Expose the web service at `https://mariafaz-web.onrender.com` (adjust name/domain).

## 5. Post-Deployment Checklist
- Visit `/api/health` to confirm the service status.
- Log into the Render dashboard and confirm the database and Redis instances are healthy.
- Verify that migrations ran successfully (`Deploys` tab > Post-deploy output).
- Test key user flows (login, PDF upload, reservation management) via the hosted UI.
- Configure a custom domain and HTTPS if required.
- Set up alerts/notifications (optional) for CPU, memory, deploy failures.

## 6. Operations & Maintenance
- **Migrations:** Future schema changes can continue to use `npm run db:migrate`; the post-deploy hook will run on every deploy. For manual runs use Render Shell ➝ `npm run db:migrate`.
- **Background Jobs:** BullMQ uses the managed Redis. If you later introduce dedicated worker processes, add a new `worker` service to `.render.yaml` with the appropriate start command (e.g. `node dist/queues/ocr.js`).
- **Environment Secrets:** Update them in Render whenever credentials rotate; `sync: false` ensures they are not overwritten by blueprint redeploys.
- **Scaling:** Upgrade the plan in `.render.yaml` (or through the dashboard) if CPU/RAM usage approaches limits.
- **Backups:** Enable automatic database backups in Render and schedule periodic recovery drills.

## 7. Troubleshooting Tips
- **Build failures:** Check the Build Logs; ensure the build command matches local steps and that the repo contains `package-lock.json`.
- **Database connection errors:** Confirm that `DATABASE_URL` is set and that the migrations completed. Render exposes credentials under the database resource.
- **CORS/API errors:** The Express server listens on `0.0.0.0:${PORT}` automatically; verify that `PORT` is not hard-coded anywhere else.
- **Large file uploads / OCR:** Increase plan limits or configure persistent disks if you retain uploaded PDFs beyond temporary processing.

With this blueprint and guide you can manage the Maria Faz deployment entirely from Render, keeping infrastructure, application code and operational runbooks in sync.
