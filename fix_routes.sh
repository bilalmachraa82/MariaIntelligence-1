#!/bin/bash
# Encontrar o início e fim da área problemática
INICIO=$(grep -n "SUBSTITUÍDA PELA ROTA UNIFICADA" server/routes.ts | cut -d':' -f1)
FIM=$(grep -n "Endpoint para processamento de imagens" server/routes.ts | cut -d':' -f1)
FIM=$((FIM - 2))

# Extrair conteúdo até o início da seção problemática
head -n $((INICIO-1)) server/routes.ts > routes_fixed.ts

# Adicionar comentário explicativo
echo "  // Rota removida em favor da rota unificada /api/ocr" >> routes_fixed.ts
echo "" >> routes_fixed.ts

# Adicionar o conteúdo após a seção problemática
tail -n +$FIM server/routes.ts >> routes_fixed.ts

# Substituir o arquivo original
mv routes_fixed.ts server/routes.ts
chmod +x fix_routes.sh

# Verificar a diferença
echo "Diferença nas linhas:"
echo "INICIO: $INICIO, FIM: $FIM"
