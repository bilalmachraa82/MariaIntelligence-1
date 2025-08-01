#!/bin/bash

echo "🚨 Script de Build de Emergência"
echo "================================"

# Limpar diretórios problemáticos
echo "🧹 Limpando diretórios problemáticos..."
rm -rf node_modules/.bufferutil* node_modules/bufferutil 2>/dev/null || true
rm -rf node_modules/@rollup node_modules/@esbuild 2>/dev/null || true

# Criar diretório de saída
echo "📁 Criando diretórios de saída..."
mkdir -p dist/public

# Verificar se temos as ferramentas essenciais
echo "🔧 Verificando ferramentas..."
if ! command -v npx &> /dev/null; then
    echo "❌ npx não encontrado!"
    exit 1
fi

# Build do cliente usando npx diretamente
echo "🎨 Building cliente (React)..."
cd client
npx --yes vite@latest build --outDir ../dist/public || {
    echo "❌ Falha no build do cliente"
    cd ..
    exit 1
}
cd ..

# Build do servidor
echo "⚙️ Building servidor (Express)..."
npx --yes esbuild@latest server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist || {
    echo "❌ Falha no build do servidor"
    exit 1
}

echo "✅ Build de emergência concluído!"
echo ""
echo "📦 Arquivos gerados em:"
echo "  - Cliente: dist/public/"
echo "  - Servidor: dist/index.js"
echo ""
echo "🚀 Para fazer deploy:"
echo "  1. Faça commit dos arquivos"
echo "  2. Push para GitHub"
echo "  3. Deploy via Vercel ou Railway"