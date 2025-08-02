#!/bin/bash

echo "🚀 Maria Faz - Deploy Automático"
echo "================================"

# Verificar se está no WSL
if grep -qi microsoft /proc/version; then
    echo "✅ Rodando no WSL"
fi

# Verificar se tem Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    # No WSL, melhor usar npx direto
    alias vercel="npx vercel"
fi

# Verificar se DATABASE_URL existe no .env
if [ -f .env ]; then
    source .env
fi

if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "⚠️  DATABASE_URL não encontrado!"
    echo ""
    echo "Por favor, adicione ao arquivo .env:"
    echo "DATABASE_URL=postgresql://..."
    echo ""
    echo "Para obter a connection string:"
    echo "1. Acesse https://console.neon.tech"
    echo "2. Crie um projeto ou use existente"
    echo "3. Copie a connection string"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL encontrado"

# Fazer deploy
echo ""
echo "📤 Fazendo deploy para Vercel..."
echo ""

# Adicionar variáveis ao Vercel
echo "⚙️  Configurando variáveis de ambiente..."
vercel env add DATABASE_URL production < <(echo "$DATABASE_URL")
vercel env add NODE_ENV production < <(echo "production")

if [ ! -z "$GEMINI_API_KEY" ]; then
    vercel env add GEMINI_API_KEY production < <(echo "$GEMINI_API_KEY")
fi

# Deploy
echo ""
echo "🚀 Iniciando deploy..."
vercel --prod

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse a URL do seu projeto"
echo "2. Use o endpoint /api/setup-db?secret=mariafaz2024setup"
echo "3. Faça login com admin@mariafaz.com / admin123"
echo ""