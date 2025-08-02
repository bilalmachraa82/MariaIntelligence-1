# 🚀 Configuração Rápida Neon DB - Maria Faz

## 1️⃣ Criar Conta Neon (2 minutos)

1. Acesse https://neon.tech
2. Clique em "Sign Up" 
3. Use GitHub ou email para criar conta
4. Confirme email se necessário

## 2️⃣ Criar Database (1 minuto)

1. No dashboard Neon, clique em "Create Database"
2. Nome do projeto: `mariafaz-prod`
3. Região: `Europe (Frankfurt)` ou mais próxima
4. Clique em "Create Project"

## 3️⃣ Obter Connection String (30 segundos)

1. No dashboard do projeto, clique em "Connection Details"
2. Copie a "Connection string" que aparece
3. Será algo como:
```
postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/mariafaz?sslmode=require
```

## 4️⃣ Configurar no Projeto (1 minuto)

### Opção A: Arquivo .env local
```bash
# Crie ou edite o arquivo .env
DATABASE_URL="postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/mariafaz?sslmode=require"
```

### Opção B: Vercel Environment Variables
1. Acesse seu projeto no Vercel
2. Settings → Environment Variables
3. Adicione:
   - Key: `DATABASE_URL`
   - Value: (cole a connection string)
   - Environment: Production, Preview, Development

## 5️⃣ Executar Migrations (2 minutos)

```bash
# No terminal do projeto
npm run db:migrate

# Se não funcionar, tente:
npx drizzle-kit push:pg
```

## 6️⃣ Verificar Conexão

```bash
# Teste rápido
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL configurado!' : '❌ DATABASE_URL não encontrado')"
```

## 🎯 Pronto!

Agora o banco de dados está configurado e pronto para uso. As tabelas serão criadas automaticamente com as migrations.

### 🆘 Problemas Comuns

**Erro de SSL:**
- Adicione `?sslmode=require` no final da URL

**Erro de permissão:**
- Verifique se copiou a connection string completa
- Confirme que o projeto no Neon está ativo

**Migration falha:**
- Certifique-se que DATABASE_URL está no .env
- Reinicie o terminal após adicionar .env

## 📊 Dados de Teste

Após configurar, você pode:
1. Importar PDFs de reservas via interface
2. Criar proprietários e propriedades manualmente
3. Usar o assistente IA para ajudar

---

**Tempo total: ~5 minutos** ⏱️