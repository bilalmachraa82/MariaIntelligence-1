# 🚀 MariaIntelligence - QUICKSTART DEPLOYMENT

**Status**: ✅ 91% Production Ready (10/11 checks passed)
**Tempo estimado**: 15-30 minutos

---

## ⚡ DEPLOYMENT EM 4 PASSOS

### **Passo 1: Rotar Password da BD** 🚨 **CRÍTICO**

```bash
🚨 Password EXPOSTA: CM7v0BQbRiTF

1. Aceder: https://console.neon.tech
2. Login na tua conta
3. Selecionar projeto: mariafaz2025
4. Ir para: Settings > Security
5. Clicar em "Reset Password" para user: mariafaz2025_owner
6. Copiar a NOVA password
7. Guardar temporariamente (vais precisar no próximo passo)
```

**⏱️ Tempo**: 2 minutos

---

### **Passo 2: Escolher Plataforma e Configurar**

#### **Opção A: Render** (Recomendado - Mais fácil)

```bash
1. Ir para: https://render.com
2. Clicar: "New +" > "Web Service"
3. Conectar GitHub repository: MariaIntelligence-1
4. Branch: main (ou claude/init-project-011CUu5dYJJRKeQzQCFZ7vtD)
5. Nome: maria-intelligence
6. Build Command: npm run build
7. Start Command: npm start
8. Adicionar Environment Variables:
```

**Environment Variables no Render**:
```bash
DATABASE_URL=postgresql://mariafaz2025_owner:<NOVA_PASSWORD>@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require&channel_binding=require

GOOGLE_GEMINI_API_KEY=<tua_api_key>

SESSION_SECRET=<gerar_com_comando_abaixo>

NODE_ENV=production

PORT=5000
```

**Gerar SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

9. Clicar: "Create Web Service"
10. Aguardar deploy (5-10 minutos)

**⏱️ Tempo**: 10 minutos

---

#### **Opção B: Vercel** (Alternativa - Mais rápido)

```bash
1. Instalar Vercel CLI:
npm install -g vercel

2. Login:
vercel login

3. Deploy:
vercel --prod

4. Configurar Environment Variables no dashboard:
https://vercel.com/dashboard

Variables (mesmas que Render acima):
- DATABASE_URL
- GOOGLE_GEMINI_API_KEY
- SESSION_SECRET
- NODE_ENV=production
```

**⏱️ Tempo**: 5 minutos

---

#### **Opção C: Docker** (Self-hosted)

```bash
1. Build:
docker build -t maria-intelligence .

2. Criar .env file:
cat > .env.docker << EOF
DATABASE_URL=postgresql://mariafaz2025_owner:<NOVA_PASSWORD>@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require
GOOGLE_GEMINI_API_KEY=<tua_key>
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NODE_ENV=production
PORT=5000
EOF

3. Run:
docker run -d \
  --name maria-intelligence \
  -p 5000:5000 \
  --env-file .env.docker \
  --restart unless-stopped \
  maria-intelligence

4. Verificar logs:
docker logs -f maria-intelligence
```

**Ou usar docker-compose**:
```bash
1. Editar docker-compose.yml (atualizar DATABASE_URL)
2. Run:
docker-compose up -d

3. Logs:
docker-compose logs -f app
```

**⏱️ Tempo**: 15 minutos

---

### **Passo 3: Validar Deployment**

```bash
# 1. Testar Health Endpoint
curl https://your-app.com/api/health

# Deve retornar:
{"status":"ok","timestamp":"2025-11-07T..."}

# 2. Testar API Routes
curl https://your-app.com/api/v1/properties

# 3. Testar Frontend
Abrir no browser: https://your-app.com

# 4. Verificar Logs
# Render: Dashboard > Logs
# Vercel: Dashboard > Deployment > Logs
# Docker: docker logs -f maria-intelligence
```

**⏱️ Tempo**: 3 minutos

---

### **Passo 4: Configurar Monitoring** (Opcional mas recomendado)

#### **Opção 1: Sentry (Error Tracking)**

```bash
1. Criar conta: https://sentry.io
2. Criar novo projeto: maria-intelligence
3. Copiar DSN
4. Adicionar environment variable:
   SENTRY_DSN=<your_dsn>

5. Instalar SDK:
npm install @sentry/node @sentry/react

6. Configurar em server/index.ts e client/src/main.tsx
```

#### **Opção 2: Render Alerts**

```bash
1. No Render dashboard
2. Settings > Alerts
3. Configurar:
   - Health Check failures
   - High CPU usage
   - High Memory usage
   - Deployment failures
```

**⏱️ Tempo**: 10 minutos

---

## 📋 CHECKLIST FINAL

- [ ] ✅ Verificação production ready: `node scripts/verify-production-ready.mjs`
- [ ] 🚨 Password da BD rotada em Neon
- [ ] 🔑 Environment variables configuradas na plataforma
- [ ] 🚀 Deploy realizado (Render/Vercel/Docker)
- [ ] ❤️ Health check a funcionar: `/api/health`
- [ ] 🌐 Frontend acessível no browser
- [ ] 📊 API routes a funcionar: `/api/v1/*`
- [ ] 📝 Logs a mostrar startup sem erros
- [ ] 🔔 Monitoring configurado (opcional)

---

## 🆘 TROUBLESHOOTING RÁPIDO

### **"Database connection failed"**
```bash
✗ Problema: Credenciais erradas ou Neon database offline

✓ Solução:
1. Verificar DATABASE_URL está correto
2. Confirmar password foi rotada corretamente
3. Testar conexão: https://console.neon.tech
4. Verificar IP allowlist em Neon (se configurado)
```

### **"Module not found"**
```bash
✗ Problema: Dependências não instaladas

✓ Solução:
1. Verificar package.json está no repo
2. Build command inclui: npm install
3. Render/Vercel: forçar rebuild
```

### **"Health check failing"**
```bash
✗ Problema: Servidor não iniciou corretamente

✓ Solução:
1. Verificar logs da plataforma
2. Confirmar PORT está correto (5000 ou variável da plataforma)
3. Verificar todas env variables estão set
4. Testar build local: npm run build && npm start
```

### **"Rate limit errors"**
```bash
✗ Problema: Muitos requests simultâneos

✓ Solução:
1. Normal durante startup (health checks)
2. Aguardar 15 minutos para reset
3. Se persistir: ajustar rate limits em server/middleware/security.ts
```

### **"Gemini API errors"**
```bash
✗ Problema: API key inválida ou quota excedida

✓ Solução:
1. Verificar GOOGLE_GEMINI_API_KEY está correto
2. Testar key: https://aistudio.google.com/app/apikey
3. Verificar quota: https://console.cloud.google.com
4. Se necessário: criar nova key
```

---

## 📊 MÉTRICAS PÓS-DEPLOYMENT

### **Primeiras 24 horas**
```bash
✓ Monitor:
- Response times (target: <500ms)
- Error rate (target: <1%)
- Database connections (target: stable)
- Memory usage (target: <512MB)
- CPU usage (target: <50%)
```

### **Primeira semana**
```bash
✓ Review:
- API usage patterns
- Most used endpoints
- Peak traffic hours
- Rate limit hits
- Error logs
```

---

## 🎯 PRÓXIMOS PASSOS (PÓS-DEPLOYMENT)

### **Curto prazo (Próximos dias)**
- [ ] Configurar custom domain
- [ ] Setup SSL certificate (automático em Render/Vercel)
- [ ] Configurar email notifications para errors
- [ ] Criar backup strategy para database
- [ ] Documentar processo de rollback

### **Médio prazo (Próximas semanas)**
- [ ] Implementar autenticação nos endpoints
- [ ] Adicionar E2E tests
- [ ] Configurar CI/CD pipeline
- [ ] Otimizar bundle size (client < 1MB)
- [ ] Limpar TypeScript warnings

### **Longo prazo (Próximos meses)**
- [ ] Implementar RAG (pgVector + embeddings)
- [ ] Agent Development Kit integration
- [ ] Performance optimization
- [ ] Analytics dashboard
- [ ] User feedback system

---

## 📚 RECURSOS ÚTEIS

### **Documentação do Projeto**
- `DEPLOYMENT.md` - Guia completo de deployment (18KB)
- `HEALTH-CHECKS.md` - Configuração de monitoring (11KB)
- `DEPLOYMENT-CHECKLIST.md` - Checklist detalhada (10KB)
- `FINAL-DEPLOYMENT-SUMMARY.md` - Resumo completo (20KB)

### **Plataformas**
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Neon: https://neon.tech/docs
- Docker: https://docs.docker.com

### **Ferramentas**
- Sentry: https://sentry.io
- Google AI Studio: https://aistudio.google.com
- Neon Console: https://console.neon.tech

---

## ✅ SUCESSO!

Se chegaste aqui e todos os passos estão ✅, **parabéns!** 🎉

**O MariaIntelligence está LIVE em produção!** 🚀

```
╔════════════════════════════════════════════════════════════════╗
║                    🎊 DEPLOYMENT COMPLETO! 🎊                  ║
║                                                                ║
║  A tua aplicação está agora disponível em:                    ║
║  https://your-app.com                                          ║
║                                                                ║
║  Health: https://your-app.com/api/health                       ║
║  API: https://your-app.com/api/v1/*                            ║
║                                                                ║
║  Monitoriza os logs e aproveita! 🚀                            ║
╚════════════════════════════════════════════════════════════════╝
```

---

**Criado**: 2025-11-07
**Versão**: 1.0
**Status**: ✅ Production Ready

*Bora lá! 🇵🇹🚀*
