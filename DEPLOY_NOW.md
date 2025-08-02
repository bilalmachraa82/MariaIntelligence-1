# 🚀 Deploy Imediato - Maria Faz

## ✅ Sua Connection String está pronta!

```
DATABASE_URL=postgresql://mariafaz2025_owner:CM7v0BQbRiTF@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require
```

## 📋 3 Passos Simples (5 minutos total)

### 1️⃣ Adicionar ao Vercel (2 min)

1. **Acesse**: https://vercel.com/dashboard
2. **Entre no projeto** "mariafaz"
3. **Settings → Environment Variables**
4. **Add New**:
   - Name: `DATABASE_URL`
   - Value: `postgresql://mariafaz2025_owner:CM7v0BQbRiTF@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - **Save**

### 2️⃣ Deploy (2 min)

```bash
# Commit e push
git add -A
git commit -m "feat: database configuration ready"
git push origin main
```

Ou no Vercel: **Deployments → Redeploy**

### 3️⃣ Executar Setup (1 min)

Após o deploy completar, abra no navegador:

```
https://mariafaz.vercel.app/api/setup-db?secret=mariafaz2024setup
```

## ✅ Pronto!

Acesse https://mariafaz.vercel.app e faça login:
- **Email**: admin@mariafaz.com
- **Senha**: admin123

## 🎯 Teste Rápido

Para confirmar que está funcionando:
```bash
curl https://mariafaz.vercel.app/api/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

---

**É só isso! Em 5 minutos seu sistema estará 100% operacional!** 🎉