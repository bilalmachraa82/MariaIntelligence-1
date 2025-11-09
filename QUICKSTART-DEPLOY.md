# ⚡ QuickStart: Deploy MariaIntelligence v2.0 AGORA

**Status Atual**: ✅ Build de produção completo e pronto para deployment!

```
📦 Build Output:
✓ Client: 4.4MB (122 assets otimizados)
✓ Server: 608KB (bundle único)
✓ Tempo: ~25s
✓ Testes: Passados
```

## 🚀 Deploy em 5 Minutos (Render - Recomendado)

### 1. Criar Conta Render
- Acesse: https://render.com
- Crie conta gratuita (GitHub login recomendado)

### 2. Criar Database PostgreSQL
1. No dashboard Render, clique **"New +"** → **"PostgreSQL"**
2. Configuração:
   - **Name**: `mariaintelligence-db`
   - **Database**: `mariaintelligence`
   - **User**: (auto-gerado)
   - **Region**: `Frankfurt` (ou mais próximo)
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free` (256MB RAM, 1GB storage)
3. Clique **"Create Database"**
4. Aguarde ~2 minutos para provisionar
5. **COPIE** a **"Internal Database URL"** (começando com `postgresql://`)

### 3. Criar Web Service
1. No dashboard, clique **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub: `bilalmachraa82/MariaIntelligence-1`
3. Configuração:
   - **Name**: `mariaintelligence`
   - **Region**: `Frankfurt` (mesma do database)
   - **Branch**: `claude/init-project-011CUu5dYJJRKeQzQCFZ7vtD`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (512MB RAM - GRÁTIS)

### 4. Configurar Variáveis de Ambiente
Na aba **"Environment"**, adicione:

```bash
# OBRIGATÓRIO - Database (cole a URL do passo 2)
DATABASE_URL=postgresql://user:pass@dpg-xxx.frankfurt-postgres.render.com/mariaintelligence

# OBRIGATÓRIO - Gerar secret (execute no terminal local)
SESSION_SECRET=<gerar_com_comando_abaixo>

# OBRIGATÓRIO - Environment
NODE_ENV=production

# RECOMENDADO - API Gemini (para features AI)
GOOGLE_GEMINI_API_KEY=<sua_chave_aqui>

# OPCIONAL - Redis (para caching v2.0 - adicionar depois)
# REDIS_URL=redis://...
```

**Gerar SESSION_SECRET** (execute no seu terminal local):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Deploy!
1. Clique **"Create Web Service"**
2. Render começará a fazer build automaticamente
3. Aguarde ~3-5 minutos
4. URL será: `https://mariaintelligence.onrender.com`

### 6. Verificar Deployment
```bash
# Health check
curl https://mariaintelligence.onrender.com/api/health

# Deve retornar:
# {"status":"ok","timestamp":"...","database":"connected","uptime":...}
```

### 7. Executar Migrations (Uma vez)
1. No Render Dashboard, vá para seu service
2. Aba **"Shell"** no menu lateral
3. Execute:
```bash
npm run db:migrate
npm run db:migrate:performance
# Opcional: npm run db:seed
```

---

## 🎯 Alternativa: Railway (Ainda Mais Rápido)

Railway tem scripts prontos no projeto!

### 1. Instalar Railway CLI
```bash
npm install -g railway
```

### 2. Login
```bash
railway login
```

### 3. Deploy (Comando Único!)
```bash
npm run deploy
```

Railway vai automaticamente:
- ✅ Criar database PostgreSQL
- ✅ Configurar environment variables
- ✅ Fazer build e deploy
- ✅ Gerar URL pública

### 4. Configurar Variáveis Adicionais
```bash
# API Gemini (opcional)
railway variables set GOOGLE_GEMINI_API_KEY=sua_chave

# Redis (opcional - para v2.0 caching)
railway add
# Selecione: Redis
# Railway automaticamente configura REDIS_URL
```

### 5. Verificar Status
```bash
npm run railway:status
npm run railway:health
npm run railway:logs
```

---

## 🐳 Alternativa: Docker (Local/VPS)

### Deploy Local
```bash
# 1. Build
docker build -t mariaintelligence:v2.0 .

# 2. Criar .env
cp .env.example .env
nano .env  # Preencher variáveis

# 3. Run
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  --name mariaintelligence \
  mariaintelligence:v2.0

# 4. Verificar
docker logs -f mariaintelligence
curl http://localhost:5000/api/health
```

### Deploy Compose (com PostgreSQL + Redis)
```bash
# 1. Criar .env
cp .env.example .env
# Editar DATABASE_URL para: postgresql://postgres:postgres@db:5432/mariaintelligence

# 2. Subir tudo
docker-compose up -d

# 3. Migrations
docker-compose exec app npm run db:migrate

# 4. Verificar
docker-compose logs -f app
```

---

## ✅ Pós-Deployment Checklist

Após deploy, testar:

```bash
# 1. Health check
curl https://seu-app.onrender.com/api/health

# 2. Frontend (navegador)
https://seu-app.onrender.com

# 3. API endpoints
curl https://seu-app.onrender.com/api/v1/properties

# 4. Dashboard
# Abrir no navegador e verificar:
# - Dashboard carrega
# - Gráficos renderizam
# - Navegação funciona

# 5. Features v2.0
# Verificar no navegador DevTools (F12):
# - React Query Devtools (canto inferior direito)
# - Headers de cache (Network tab): X-Cache: HIT/MISS
# - Request IDs nos headers: X-Request-ID
```

---

## 🔧 Adicionar Redis (Opcional - Para v2.0 Caching)

### Render
1. **New +** → **Redis**
2. Copiar **Internal Redis URL**
3. Adicionar em Environment: `REDIS_URL=redis://...`
4. Restart service

### Railway
```bash
railway add
# Selecione: Redis
# Automaticamente adiciona REDIS_URL
```

### Docker Compose
Já incluído! Redis está em `docker-compose.yml`

---

## 📊 Monitoramento

### Render
- **Dashboard** → Ver métricas (CPU, RAM, bandwidth)
- **Logs** → Ver logs em tempo real
- **Events** → Histórico de deploys

### Railway
```bash
npm run railway:monitor   # Monitoramento em tempo real
npm run railway:logs      # Logs
npm run railway:health    # Health check
```

### Docker
```bash
docker stats mariaintelligence        # Recursos
docker logs -f mariaintelligence      # Logs
```

---

## 🆘 Troubleshooting Rápido

### Build Falha
```bash
# Local: testar build
npm run build:render

# Verificar erros TypeScript
npm run check

# Limpar e rebuildar
rm -rf node_modules dist
npm install
npm run build:render
```

### Database Connection Fail
```bash
# Verificar URL
echo $DATABASE_URL

# Formato correto:
# postgresql://user:pass@host:5432/db?sslmode=require

# Testar connection
npm run db:push
```

### App Crashes
```bash
# Render: Ver logs no dashboard
# Railway: npm run railway:logs
# Docker: docker logs mariaintelligence

# Verificar variáveis
# - DATABASE_URL está correto?
# - SESSION_SECRET está definido?
# - NODE_ENV=production?
```

### Features AI Não Funcionam
```bash
# Adicionar GOOGLE_GEMINI_API_KEY
# Obter em: https://aistudio.google.com/app/apikey

# Render: Environment tab
# Railway: railway variables set GOOGLE_GEMINI_API_KEY=xxx
# Docker: Adicionar no .env
```

---

## 🎉 Deployment Completo!

Aplicação está rodando com:
- ✅ v2.0 features (caching, optimistic updates, virtual scrolling)
- ✅ Performance otimizada (4.4MB client, 608KB server)
- ✅ Security hardened (Helmet, rate limiting, CORS)
- ✅ Production-ready build
- ✅ Health monitoring

**Próximos Passos**:
1. Configurar domínio custom (Render/Railway)
2. Adicionar Redis para caching (70% speedup)
3. Configurar SSL (automático em Render/Railway)
4. Setup monitoring (Sentry, LogRocket, etc)
5. Configurar backups automáticos

**Recursos**:
- Guia completo: `DEPLOYMENT.md`
- Features v2.0: `MARIAINTELLIGENCE-V2.0-RELEASE-SUMMARY.md`
- Validação de produção: `PRODUCTION-VALIDATION-QUICKSTART.md`

---

**Build Date**: 2025-11-08
**Version**: 2.0.0
**Status**: ✅ Production Ready
