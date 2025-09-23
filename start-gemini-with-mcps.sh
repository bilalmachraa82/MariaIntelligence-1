#!/bin/bash

# Script para iniciar Gemini com MCPs configurados para MariaIntelligence-1
# Uso: ./start-gemini-with-mcps.sh

echo "🚀 Iniciando Gemini com MCPs configurados..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto MariaIntelligence-1"
    exit 1
fi

# Configurar MCPs disponíveis
MCP_SERVERS="context7,filesystem,memory,sequential-thinking"

echo "📦 MCPs configurados: $MCP_SERVERS"
echo "📁 Diretório do projeto: $(pwd)"
echo "🔧 Modo experimental ACP ativado"
echo ""

# Iniciar Gemini com configurações MCP
gemini \
    --experimental-acp \
    --allowed-mcp-server-names $MCP_SERVERS \
    --include-directories $(pwd) \
    --checkpointing

echo "✅ Gemini finalizado"