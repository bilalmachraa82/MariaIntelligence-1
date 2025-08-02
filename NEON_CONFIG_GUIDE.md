# 🚀 Guia de Configuração Neon DB - Maria Faz

## Status Atual
- ✅ Site no Vercel: https://mariafaz.vercel.app
- ❌ Banco de dados: Não configurado
- ❌ Dados: Nenhum proprietário/propriedade aparece

## 🔧 Passo 1: Criar conta no Neon (2 minutos)

1. **Acesse Neon**
   - Abra: https://neon.tech
   - Clique em "Sign up"
   - Use sua conta GitHub (mais rápido)

2. **Confirme o email** (se necessário)

## 🗄️ Passo 2: Criar Database (3 minutos)

1. **No dashboard Neon, clique "Create Database"**
   
2. **Configure:**
   - **Project name**: `mariafaz-prod`
   - **Database name**: `mariafaz` (vai criar automaticamente)
   - **Region**: `Europe (Frankfurt)` ou mais próxima de você
   - **Branch**: deixe `main`
   
3. **Clique "Create Project"**

## 🔑 Passo 3: Copiar Connection String (1 minuto)

1. **Após criar, você verá a connection string**
   - Aparece no formato:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

2. **COPIE TODA A STRING** (clique no botão copiar)
   - Exemplo real seria algo como:
   ```
   postgresql://bilal:AbC123xYz@ep-cool-forest-123456.eu-central-1.aws.neon.tech/mariafaz?sslmode=require
   ```

## ⚙️ Passo 4: Configurar no Vercel (3 minutos)

1. **Acesse seu projeto Vercel**
   - https://vercel.com/dashboard
   - Clique em "mariafaz"

2. **Vá em Settings → Environment Variables**

3. **Adicione DATABASE_URL:**
   - Clique "Add New"
   - **Key**: `DATABASE_URL`
   - **Value**: (cole a connection string copiada)
   - **Environment**: Marque todas as 3 opções:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Clique "Save"

4. **Adicione NODE_ENV (se não existir):**
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - Marque os 3 ambientes
   - Clique "Save"

5. **Verifique GEMINI_API_KEY:**
   - Se não existir, adicione:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyBNP6J4Mu972qII--3Hzztz5Xt377reN1k`

## 🔄 Passo 5: Forçar Redeploy (2 minutos)

1. **No Vercel, vá em "Deployments"**
2. **Clique nos 3 pontinhos do último deploy**
3. **Clique "Redeploy"**
4. **Confirme "Redeploy"**

## 💻 Passo 6: Executar Migrations (5 minutos)

### Opção A - Localmente (Recomendado)

1. **Crie arquivo .env.local** na pasta do projeto:
   ```bash
   echo "DATABASE_URL=postgresql://..." > .env.local
   ```
   (substitua ... pela sua connection string)

2. **Execute os comandos:**
   ```bash
   # Instalar dependências (se necessário)
   npm install

   # Executar migrations
   npm run db:migrate

   # Popular banco com dados iniciais
   npm run db:seed
   ```

### Opção B - Via Vercel CLI

1. **Instale Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Puxe as variáveis:**
   ```bash
   vercel env pull .env.local
   ```

3. **Execute:**
   ```bash
   npm run db:setup
   ```

## ✅ Passo 7: Verificar Sistema (2 minutos)

1. **Acesse**: https://mariafaz.vercel.app
2. **Faça login**:
   - Email: `admin@mariafaz.com`
   - Senha: `admin123`

3. **Verifique se aparecem:**
   - ✅ Proprietários (2)
   - ✅ Propriedades (3)
   - ✅ Reservas (2)

## 🎯 Teste Final: Importar PDF

1. **Vá em Reservas → Importar PDF**
2. **Use um dos PDFs de exemplo em `/public`:**
   - `Controlo_Aroeira.pdf`
   - `Controlo_Magnolia.pdf`
3. **O sistema deve:**
   - Detectar o formato
   - Extrair reservas
   - Fazer match de propriedades

## ❓ Troubleshooting

### "Connection failed"
- Verifique se copiou a connection string COMPLETA
- Confirme que adicionou ao Vercel corretamente
- Tente fazer redeploy

### "No data appearing"
- Execute `npm run db:seed` localmente
- Verifique se as migrations rodaram: `npm run db:validate`

### "Login failed"
- Confirme que o seed rodou: deve mostrar "✅ 1 usuário admin"
- Email: admin@mariafaz.com
- Senha: admin123

## 📱 Suporte Rápido

Se precisar de ajuda:
1. Verifique os logs no Vercel (Functions tab)
2. Execute: `node check-system.mjs`
3. Consulte: `DEPLOY_VERCEL_COMPLETO.md`

---

**Tempo total: ~20 minutos** ⏱️

Após configurar, seu sistema estará 100% operacional!