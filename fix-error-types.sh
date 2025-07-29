#!/bin/bash

# Script para corrigir erros de tipo em blocos catch no adaptador de IA
FILE="server/services/ai-adapter.service.ts"

# Substituir todos os blocos catch sem tipagem
sed -i 's/catch (error) {/catch (error: any) {/g' "$FILE"

echo "Correções aplicadas ao arquivo $FILE"
