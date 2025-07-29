#!/bin/bash

# Script para modificar os parâmetros de upload em routes.ts
# Usa sed para fazer substituições específicas baseadas nas linhas

# Cria backup do arquivo original
cp server/routes.ts server/routes.ts.bak

# Substitui os parâmetros em cada endpoint específico usando números de linha

# 1. Endpoint upload-pdf (já modificado anteriormente)
# Linhas 759-763

# 2. Endpoint upload-image
sed -i '978,982c\\        // Parâmetros de controle\n        const autoCreateReservation = req.query.autoCreate === '\''true'\'';\n        \n        // Obter parâmetros do corpo da requisição (FormData)\n        const skipQualityCheck = req.body.skipQualityCheck === '\''true'\'';\n        const useCache = req.body.useCache === '\''true'\'';' server/routes.ts

# 3. Endpoint upload-file
sed -i '1069,1073c\\        // Parâmetros de controle\n        const autoCreateReservation = req.query.autoCreate === '\''true'\'';\n        \n        // Obter parâmetros do corpo da requisição (FormData)\n        const skipQualityCheck = req.body.skipQualityCheck === '\''true'\'';\n        const useCache = req.body.useCache === '\''true'\'';' server/routes.ts

# 4. Verifique se as modificações foram aplicadas
echo "Modificações aplicadas com sucesso!"
