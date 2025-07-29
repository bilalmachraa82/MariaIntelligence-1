#!/bin/bash

# Script para testar a rota de OCR com arquivos contendo aliases de propriedades

# Função para testar o OCR
test_ocr() {
  local file_path=$1
  local service=$2
  local file_name=$(basename "$file_path")
  
  echo "🧪 Testando OCR para $file_name usando serviço: $service"
  
  # Enviar requisição para a API OCR
  curl -s -X POST \
    -F "pdf=@$file_path" \
    "http://localhost:5000/api/ocr?provider=$service" > ocr_response.json
  
  # Extrair propriedade encontrada e analisar a resposta JSON para extração mais precisa
  property_id=$(cat ocr_response.json | grep -o '"propertyId":[0-9]*' | cut -d':' -f2)
  property_name=$(cat ocr_response.json | grep -o '"propertyName":"[^"]*"' | cut -d'"' -f4)
  
  # Obter mais informações da reserva extraída
  raw_text=$(cat ocr_response.json | grep -o '"rawText":"[^"]*"' | cut -d'"' -f4 | head -15)
  
  echo "📄 Resultado para $file_name:"
  
  if [ -n "$property_id" ]; then
    echo "✅ Propriedade encontrada: $property_name (ID: $property_id)"
    echo "🔄 Correspondência por alias bem-sucedida!"
    echo "📝 Primeiras linhas do texto extraído:"
    echo "$raw_text" | head -3
  else
    echo "❌ Propriedade não encontrada"
    if [ -n "$property_name" ]; then
      echo "🔍 Nome de propriedade extraído: $property_name"
      echo "⚠️ Falha na correspondência por alias"
    fi
  fi
  
  echo "-----------------------------------"
}

# Testando diferentes arquivos PDF com o OCR
echo "🚀 Iniciando testes de OCR com aliases..."

# Testar com diferentes serviços
test_ocr "Controlo_Aroeira I.pdf" "auto"
test_ocr "Controlo_Aroeira I.pdf" "openrouter"
test_ocr "Controlo_Aroeira I.pdf" "native"

# Testar com arquivos que contêm diferentes nomes para Aroeira
if [ -f "Controlo_Aroeira I (6).pdf" ]; then
  test_ocr "Controlo_Aroeira I (6).pdf" "auto"
fi

if [ -f "Controlo_Aroeira II (6).pdf" ]; then
  test_ocr "Controlo_Aroeira II (6).pdf" "auto"
fi

echo "🏁 Testes de OCR concluídos!"