#!/bin/bash

# Script para testar o processamento de PDF usando o serviço Gemini
# Utiliza curl para fazer chamadas à API

echo "=== TESTE DE PROCESSAMENTO DE PDF COM GEMINI ==="

# Verificar o serviço de IA atual
echo "🔍 Verificando serviço de IA atual..."
RESPONSE=$(curl -s "http://localhost:5000/api/check-ai-services")
echo "Resposta: $RESPONSE"
CURRENT_SERVICE=$(echo $RESPONSE | grep -o '"currentService":"[^"]*"' | cut -d':' -f2 | tr -d '"')
echo "🤖 Serviço de IA atual: $CURRENT_SERVICE"

# Selecionar o serviço Gemini explicitamente
if [ "$CURRENT_SERVICE" != "gemini" ]; then
  echo "🔄 Alterando para o serviço Gemini..."
  curl -s -X POST "http://localhost:5000/api/set-ai-service" \
       -H "Content-Type: application/json" \
       -d '{"service":"gemini"}'
  echo "✅ Serviço alterado para Gemini"
fi

# Testar o adaptador de IA
echo "🧪 Testando adaptador de IA..."
TEST_RESPONSE=$(curl -s "http://localhost:5000/api/test-ai-adapter")
echo "Resposta: $TEST_RESPONSE"

# Enviar um PDF para processamento
echo "📤 Enviando PDF para processamento..."
PDF_PATH="Check-in Maria faz.pdf"

if [ -f "$PDF_PATH" ]; then
  UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/upload-pdf" \
                      -F "pdf=@$PDF_PATH")
  echo "📄 Resposta do processamento do PDF:"
  echo "$UPLOAD_RESPONSE" | grep -o '"success":[^,]*' 
  echo "$UPLOAD_RESPONSE" | grep -o '"propertyName":"[^"]*"'
  echo "$UPLOAD_RESPONSE" | grep -o '"checkInDate":"[^"]*"'
  echo "$UPLOAD_RESPONSE" | grep -o '"checkOutDate":"[^"]*"'
  echo "$UPLOAD_RESPONSE" | grep -o '"guestName":"[^"]*"'

  SUCCESS=$(echo $UPLOAD_RESPONSE | grep -o '"success":\s*true')
  if [ -n "$SUCCESS" ]; then
    echo "✅ Teste de processamento de PDF concluído com sucesso!"
  else
    echo "❌ Teste de processamento de PDF falhou."
  fi
else
  echo "❌ Arquivo PDF não encontrado: $PDF_PATH"
fi