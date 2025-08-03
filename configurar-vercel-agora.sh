#!/bin/bash

# Script para configurar variáveis de ambiente no Vercel via CLI
# Certifica-te que tens o Vercel CLI instalado: npm i -g vercel

echo "🚀 Configurando variáveis de ambiente no Vercel..."

# Variáveis necessárias
DATABASE_URL=""
SESSION_SECRET=$(openssl rand -hex 32)
VITE_API_URL="https://mariafaz.vercel.app"

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instala com: npm i -g vercel"
    exit 1
fi

echo "📝 Vamos configurar as variáveis de ambiente..."

# Opção 1: Usar Neon existente
echo ""
echo "Tens uma base de dados Neon existente? (s/n)"
read -r has_neon

if [ "$has_neon" = "s" ]; then
    echo "Cola a DATABASE_URL do Neon (formato: postgresql://user:pass@host/db?sslmode=require):"
    read -r DATABASE_URL
else
    echo "🔗 Precisas criar uma base de dados Neon:"
    echo "1. Vai a https://neon.tech"
    echo "2. Cria conta gratuita"
    echo "3. Cria projeto 'mariafaz'"
    echo "4. Copia a connection string"
    echo ""
    echo "Cola a DATABASE_URL quando tiveres:"
    read -r DATABASE_URL
fi

# Verificar se DATABASE_URL foi fornecida
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL é obrigatória!"
    exit 1
fi

# Adicionar variáveis ao Vercel
echo ""
echo "🔧 Adicionando variáveis ao Vercel..."

# DATABASE_URL
vercel env add DATABASE_URL production <<< "$DATABASE_URL"
echo "✅ DATABASE_URL configurada"

# SESSION_SECRET
vercel env add SESSION_SECRET production <<< "$SESSION_SECRET"
echo "✅ SESSION_SECRET configurada"

# VITE_API_URL
vercel env add VITE_API_URL production <<< "$VITE_API_URL"
echo "✅ VITE_API_URL configurada"

# APIs já configuradas localmente
if [ -n "$MISTRAL_API_KEY" ]; then
    vercel env add MISTRAL_API_KEY production <<< "$MISTRAL_API_KEY"
    echo "✅ MISTRAL_API_KEY configurada"
fi

if [ -n "$OPENROUTER_API_KEY" ]; then
    vercel env add OPENROUTER_API_KEY production <<< "$OPENROUTER_API_KEY"
    echo "✅ OPENROUTER_API_KEY configurada"
fi

if [ -n "$GOOGLE_GEMINI_API_KEY" ]; then
    vercel env add GOOGLE_GEMINI_API_KEY production <<< "$GOOGLE_GEMINI_API_KEY"
    echo "✅ GOOGLE_GEMINI_API_KEY configurada"
fi

echo ""
echo "🎉 Variáveis configuradas com sucesso!"
echo ""
echo "📦 Fazendo redeploy..."
vercel --prod

echo ""
echo "✅ Deploy iniciado! Aguarda 2-5 minutos e acede a:"
echo "👉 https://mariafaz.vercel.app"