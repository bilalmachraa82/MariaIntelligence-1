#!/bin/bash
# Script para verificar qual processo está usando a porta 5000
# e encerrá-lo para liberar a porta

echo "Verificando processos na porta 5000..."
fuser -n tcp 5000 2>/dev/null

echo "Tentando encerrar processos na porta 5000..."
fuser -k -n tcp 5000 2>/dev/null

echo "Verificando novamente..."
fuser -n tcp 5000 2>/dev/null

echo "Concluído!"