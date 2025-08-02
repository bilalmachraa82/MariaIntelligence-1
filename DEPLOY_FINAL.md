# 🚀 Deploy Final - Maria Faz

## ✅ Seus Dados Neon

- **Projeto**: mariafaz (ID: plain-recipe-77049551)
- **Host**: ep-dark-waterfall-a28ar6lp.eu-central-1.aws.neon.tech
- **Região**: EU Central (Frankfurt)
- **Branch**: br-crimson-rain-a2nr25qh

## 📋 Passos para Finalizar (10 minutos)

### 1️⃣ Obter Connection String Completa (2 min)

1. **Acesse seu projeto Neon**:
   - Link direto: https://console.neon.tech/app/projects/plain-recipe-77049551
   
2. **Na dashboard do projeto**:
   - Clique em "Connection Details" ou "Connection String"
   - Marque "Show password" ✅
   - Copie TODA a string (incluindo senha)

### 2️⃣ Adicionar ao Vercel (3 min)

1. **Acesse Vercel**:
   - https://vercel.com/dashboard
   - Entre no projeto "mariafaz"

2. **Settings → Environment Variables**

3. **Adicione DATABASE_URL**:
   - Variable Name: `DATABASE_URL`
   - Value: (cole a connection string completa)
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Save

4. **Verifique outras variáveis**:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = `AIzaSyBNP6J4Mu972qII--3Hzztz5Xt377reN1k` (já tem no .env)

### 3️⃣ Deploy (2 min)

```bash
# Commit e push dos arquivos criados
git add -A
git commit -m "feat: database setup configuration"
git push origin main
```

### 4️⃣ Executar Setup (3 min)

1. **Aguarde deploy** (~2 min)

2. **Acesse no navegador**:
   ```
   https://mariafaz.vercel.app/api/setup-db?secret=mariafaz2024setup
   ```

3. **Você verá**:
   ```json
   {
     "success": true,
     "stats": {
       "users": "1",
       "owners": "2",
       "properties": "3"
     }
   }
   ```

### 5️⃣ Testar Sistema

1. **Acesse**: https://mariafaz.vercel.app
2. **Login**: admin@mariafaz.com / admin123
3. **Verifique**:
   - Dashboard com dados
   - Proprietários listados
   - Propriedades visíveis

## 🎯 Se a Connection String não aparecer no Neon

### Opção A: Reset de senha
1. No Neon, vá em "Roles"
2. Clique no role principal
3. "Reset password"
4. Copie a nova connection string

### Opção B: Criar novo role
1. No Neon → Roles → Create Role
2. Nome: `mariafaz_user`
3. Copie a connection string gerada

## ⚡ Comando Rápido para Testar

```bash
# Depois de configurar DATABASE_URL no Vercel
curl -I https://mariafaz.vercel.app/api/health
```

## 🛠️ Troubleshooting

### "DATABASE_URL not configured"
- Confirme que salvou no Vercel
- Fez redeploy após salvar

### "Connection refused"
- Verifique se copiou a string completa
- Confirme que tem `?sslmode=require` no final

### Página sem dados após setup
- Limpe cache (Ctrl+F5)
- Verifique Console (F12) para erros

---

**🎉 Após esses passos, seu sistema estará 100% operacional!**