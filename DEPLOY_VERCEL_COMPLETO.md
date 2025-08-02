# 🚀 Guia Completo de Deploy - Maria Faz no Vercel

## 📋 Checklist Pré-Deploy

Execute este comando para verificar se está tudo pronto:
```bash
npm run verify
```

## 🗄️ Passo 1: Configurar Neon Database (5 minutos)

### 1.1 Criar conta Neon
1. Acesse https://neon.tech
2. Clique "Sign up" → Use GitHub ou email
3. Confirme o email se necessário

### 1.2 Criar Database
1. No dashboard, clique "Create Database"
2. **Nome**: `mariafaz-prod`
3. **Região**: `Europe (Frankfurt)` ou mais próxima
4. Clique "Create Project"

### 1.3 Copiar Connection String
1. No dashboard do projeto, veja "Connection Details"
2. **Copie** a connection string completa:
```
postgresql://user:password@ep-name-123456.eu-central-1.aws.neon.tech/mariafaz?sslmode=require
```

## ⚙️ Passo 2: Configurar Vercel (5 minutos)

### 2.1 Acessar projeto no Vercel
1. Acesse https://vercel.com/dashboard
2. Clique no projeto `mariafaz`
3. Vá em **Settings** → **Environment Variables**

### 2.2 Adicionar DATABASE_URL
1. Clique "Add New"
2. **Key**: `DATABASE_URL`
3. **Value**: (cole a connection string do Neon)
4. **Environment**: Marque todas (Production, Preview, Development)
5. Clique "Save"

### 2.3 Verificar outras variáveis
Confirme que estas também estão configuradas:
- `NODE_ENV` = `production`
- `GEMINI_API_KEY` = (sua chave da Google AI)

## 🔨 Passo 3: Deploy e Migrations (10 minutos)

### 3.1 Fazer deploy
```bash
# Commit suas mudanças
git add .
git commit -m "feat: configuração final para produção"
git push origin main
```

### 3.2 Executar migrations
Após o deploy completar no Vercel:

**Opção A - Via Vercel CLI:**
```bash
# Instalar Vercel CLI se não tiver
npm i -g vercel

# Executar migrations
vercel env pull .env.local
npm run db:migrate
```

**Opção B - Localmente com .env:**
```bash
# Criar arquivo .env.local
echo "DATABASE_URL=postgresql://..." > .env.local

# Executar migrations e seed
npm run db:setup
```

## 🌱 Passo 4: Popular Dados Iniciais (5 minutos)

### 4.1 Executar seed automático
```bash
npm run db:seed
```

Isso criará:
- ✅ 1 usuário admin (admin@mariafaz.com / admin123)
- ✅ 2 proprietários de exemplo
- ✅ 3 propriedades
- ✅ 2 equipes de limpeza
- ✅ 2 reservas futuras

### 4.2 Fazer login no sistema
1. Acesse https://mariafaz.vercel.app
2. Login: `admin@mariafaz.com`
3. Senha: `admin123`
4. **IMPORTANTE**: Mude a senha após o primeiro login!

## 📄 Passo 5: Testar Importação PDF (5 minutos)

### 5.1 Preparar PDFs
Use os PDFs de exemplo em `/public`:
- `Controlo_Aroeira.pdf`
- `Controlo_Magnolia.pdf`
- Ou qualquer PDF do Booking/Airbnb

### 5.2 Importar via Interface
1. Vá em **Reservas** → **Importar PDF**
2. Arraste o PDF ou clique para selecionar
3. Sistema vai:
   - Detectar formato (Booking/Airbnb)
   - Extrair reservas
   - Fazer match de propriedades
   - Mostrar resultados para revisão

### 5.3 Revisar matches
- ✅ **Match automático**: Propriedade encontrada com 85%+ certeza
- ⚠️ **Sugestões**: Escolha a propriedade correta
- ➕ **Nova**: Crie nova propriedade se necessário

## 🔍 Passo 6: Validação Final (5 minutos)

### 6.1 Testar funcionalidades principais
- [ ] Dashboard carrega com dados
- [ ] Criar nova propriedade
- [ ] Criar nova reserva manual
- [ ] Importar PDF com sucesso
- [ ] Chat IA respondendo
- [ ] Relatórios funcionando

### 6.2 Verificar performance
```bash
# No console do navegador
console.time('pageLoad');
location.reload();
// Deve carregar em < 2 segundos
```

### 6.3 Testar em mobile
- Abra em dispositivo móvel
- Navegue pelas principais telas
- Confirme responsividade

## 🎯 Configurações Avançadas (Opcional)

### Domínio Personalizado
1. Vercel → Settings → Domains
2. Add Domain: `mariafaz.com`
3. Configure DNS:
   ```
   A Record: 76.76.21.21
   CNAME: cname.vercel-dns.com
   ```

### Analytics
1. Vercel → Analytics → Enable
2. Adiciona tracking automático
3. Zero configuração

### Monitoramento de Erros
```javascript
// Já implementado em:
// /api/error-monitoring/stats
// /api/error-monitoring/health
// /api/security/metrics
```

### Backups Automáticos
No Neon Dashboard:
1. Settings → Backups
2. Enable automatic backups
3. Retention: 7 days (grátis)

## 📊 Métricas de Sucesso

Após configuração completa:
- ⚡ Tempo de carregamento: < 2s
- 🌍 CDN global: 100+ edge locations
- 🔒 SSL automático: A+ rating
- 📱 Mobile score: 95+/100
- 🚀 Uptime: 99.9%

## 🆘 Troubleshooting

### "Database connection failed"
```bash
# Verificar DATABASE_URL
npm run verify

# Testar conexão
node -e "console.log(process.env.DATABASE_URL)"
```

### "Migrations failed"
```bash
# Forçar migrations
npm run db:migrate:force

# Verificar status
npm run db:validate
```

### "PDF import não funciona"
- Verificar rate limit (10/hora)
- PDF deve ser < 10MB
- Formato deve ser Booking/Airbnb

### "Vercel build failed"
```bash
# Build local primeiro
npm run build

# Verificar logs
vercel logs
```

## ✅ Deploy Completo!

Seu sistema Maria Faz está agora:
- 🌐 Online em produção
- 🔐 Seguro com HTTPS
- 🗄️ Banco de dados configurado
- 📊 Com dados iniciais
- 🚀 Pronto para uso!

**URL de Produção**: https://mariafaz.vercel.app

---

**Tempo total estimado: 30 minutos** ⏱️