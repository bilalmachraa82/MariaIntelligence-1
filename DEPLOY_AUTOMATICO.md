# 🚀 Deploy Automático - Maria Faz

## Opção 1: Se já tem Neon DB criado

### Passo 1: Adicionar DATABASE_URL ao .env.local
```bash
# Crie o arquivo .env.local com sua connection string
echo "DATABASE_URL=postgresql://[seu-usuario]:[sua-senha]@[seu-host]/[seu-database]?sslmode=require" > .env.local
```

### Passo 2: Executar deploy automático
```bash
# Commit dos arquivos criados
git add api/setup-db.js NEON_QUICK_ACTION.md DEPLOY_AUTOMATICO.md
git commit -m "feat: automated database setup"
git push origin main
```

### Passo 3: Configurar no Vercel (via browser)
1. Acesse: https://vercel.com/dashboard
2. Entre no projeto "mariafaz"
3. Settings → Environment Variables
4. Add New:
   - Name: `DATABASE_URL`
   - Value: (sua connection string do Neon)
   - Environment: ✅ All (Production, Preview, Development)
5. Save

### Passo 4: Forçar redeploy
1. Em Vercel → Deployments
2. Clique "..." → Redeploy
3. Aguarde ~3 minutos

### Passo 5: Executar setup
Após deploy, acesse no navegador:
```
https://mariafaz.vercel.app/api/setup-db?secret=mariafaz2024setup
```

## Opção 2: Criar Neon DB do zero

### Via Neon Console:
1. Acesse https://neon.tech
2. Sign up/Login
3. Create Database:
   - Name: `mariafaz-prod`
   - Region: Europe (mais próximo)
4. Copie a connection string
5. Siga os passos da Opção 1

## Verificação Final

Após setup, teste:
1. https://mariafaz.vercel.app
2. Login: admin@mariafaz.com / admin123
3. Verifique se dados aparecem

## Comando rápido WSL

Se preferir linha de comando:
```bash
# Verificar status
curl https://mariafaz.vercel.app/api/health

# Executar setup (após configurar DATABASE_URL)
curl "https://mariafaz.vercel.app/api/setup-db?secret=mariafaz2024setup"
```

---
**Tempo total: 10-15 minutos**