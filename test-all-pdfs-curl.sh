#!/bin/bash

# TESTE SISTEMÁTICO DE TODOS OS PDFs - MARIA FAZ
# Script que testa todos os PDFs usando curl e analisa os resultados

echo "🚀 INICIANDO TESTE SISTEMÁTICO DE TODOS OS PDFs"
echo "=================================================================="

# Contador de resultados
TOTAL=0
SUCCESS=0
FAILED=0

# Arrays para armazenar resultados
declare -a SUCCESSFUL_FILES=()
declare -a FAILED_FILES=()

# Função para testar um PDF
test_pdf() {
    local file="$1"
    local expected_type="$2"
    
    echo ""
    echo "🧪 TESTANDO: $file ($expected_type)"
    echo "============================================================"
    
    if [ ! -f "$file" ]; then
        echo "❌ ARQUIVO NÃO ENCONTRADO: $file"
        FAILED_FILES+=("$file - FILE NOT FOUND")
        ((FAILED++))
        ((TOTAL++))
        return
    fi
    
    # Fazer upload do PDF
    echo "📤 Fazendo upload..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -F "pdf=@$file" http://localhost:5000/api/pdf/upload-pdf)
    
    # Separar resposta e código HTTP
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    JSON_RESPONSE=$(echo "$RESPONSE" | head -n -1)
    
    echo "📊 HTTP CODE: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Analisar resposta JSON
        echo "✅ UPLOAD SUCESSO"
        echo "📋 RESPOSTA: $JSON_RESPONSE"
        
        # Verificar se processamento foi bem-sucedido
        if echo "$JSON_RESPONSE" | grep -q '"success":true'; then
            echo "✅ PROCESSAMENTO SUCESSO"
            SUCCESSFUL_FILES+=("$file")
            ((SUCCESS++))
        else
            echo "❌ PROCESSAMENTO FALHOU"
            FAILED_FILES+=("$file - PROCESSING FAILED")
            ((FAILED++))
        fi
    else
        echo "❌ UPLOAD FALHOU: HTTP $HTTP_CODE"
        echo "📋 RESPOSTA: $JSON_RESPONSE"
        FAILED_FILES+=("$file - HTTP $HTTP_CODE")
        ((FAILED++))
    fi
    
    ((TOTAL++))
    
    # Pausa entre testes
    sleep 3
}

echo "📋 LISTA DE ARQUIVOS A TESTAR:"
echo "================================"

# Lista de PDFs para testar com tipo esperado
declare -A PDF_FILES=(
    ["file (13).pdf"]="CHECK-OUT"
    ["file (14).pdf"]="CHECK-IN"
    ["Check-in Maria faz.pdf"]="CHECK-IN"
    ["Check-outs Maria faz.pdf"]="CHECK-OUT"
    ["Controlo_5 de Outubro (9).pdf"]="CONTROL"
    ["Controlo_Aroeira I (6).pdf"]="CONTROL"
    ["Controlo_Aroeira II (6).pdf"]="CONTROL"
    ["Controlo_Feira da Ladra (Graça 1) (9).pdf"]="CONTROL"
    ["Controlo_Sete Rios (9).pdf"]="CONTROL"
    ["entrada.pdf"]="ENTRADA"
    ["saida.pdf"]="SAIDA"
    ["file (2) (3).pdf"]="OTHER"
    ["file (3).pdf"]="OTHER"
    ["orcamento_familia_silva_9999.pdf"]="BUDGET"
)

# Listar arquivos encontrados
for file in "${!PDF_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file (${PDF_FILES[$file]})"
    else
        echo "❌ $file (${PDF_FILES[$file]}) - NÃO ENCONTRADO"
    fi
done

echo ""
echo "🔄 ANÁLISE ESPECIAL: FILE(13) + FILE(14) - CHECK-IN/CHECK-OUT"
echo "=================================================================="

# Testar file(13) e file(14) primeiro para análise conjunto
echo ""
echo "📤 FASE 1: TESTANDO FILE(13) - ESPERADO: CHECK-OUT"
test_pdf "file (13).pdf" "CHECK-OUT"

echo ""
echo "📥 FASE 2: TESTANDO FILE(14) - ESPERADO: CHECK-IN"
test_pdf "file (14).pdf" "CHECK-IN"

echo ""
echo "🔍 ANÁLISE CONSOLIDAÇÃO FILE(13) + FILE(14):"
echo "=============================================="

# Verificar se ambos foram processados
FILE13_SUCCESS=false
FILE14_SUCCESS=false

for file in "${SUCCESSFUL_FILES[@]}"; do
    if [[ "$file" == "file (13).pdf" ]]; then
        FILE13_SUCCESS=true
    elif [[ "$file" == "file (14).pdf" ]]; then
        FILE14_SUCCESS=true
    fi
done

if [ "$FILE13_SUCCESS" = true ] && [ "$FILE14_SUCCESS" = true ]; then
    echo "✅ AMBOS ARQUIVOS PROCESSADOS - CONSOLIDAÇÃO POSSÍVEL"
elif [ "$FILE13_SUCCESS" = true ] || [ "$FILE14_SUCCESS" = true ]; then
    echo "⚠️ APENAS UM ARQUIVO PROCESSADO - CONSOLIDAÇÃO PARCIAL"
else
    echo "❌ NENHUM ARQUIVO PROCESSADO - CONSOLIDAÇÃO IMPOSSÍVEL"
fi

echo ""
echo "📋 FASE 3: TESTANDO TODOS OS OUTROS PDFs"
echo "=========================================="

# Testar todos os outros PDFs
for file in "${!PDF_FILES[@]}"; do
    # Pular file(13) e file(14) já testados
    if [[ "$file" != "file (13).pdf" ]] && [[ "$file" != "file (14).pdf" ]]; then
        test_pdf "$file" "${PDF_FILES[$file]}"
    fi
done

echo ""
echo "📊 RELATÓRIO FINAL SISTEMÁTICO"
echo "=================================================================="
echo "📈 ESTATÍSTICAS GERAIS:"
echo "   📋 Total testado: $TOTAL"
echo "   ✅ Sucessos: $SUCCESS" 
echo "   ❌ Falhas: $FAILED"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((SUCCESS * 100 / TOTAL))
    echo "   📊 Taxa de sucesso: $SUCCESS_RATE%"
fi

echo ""
echo "✅ ARQUIVOS PROCESSADOS COM SUCESSO:"
for file in "${SUCCESSFUL_FILES[@]}"; do
    echo "   ✓ $file"
done

echo ""
echo "❌ ARQUIVOS QUE FALHARAM:"
for file in "${FAILED_FILES[@]}"; do
    echo "   ✗ $file"
done

echo ""
echo "🗄️ VERIFICANDO ESTADO DA BASE DE DADOS:"
echo "========================================"

# Verificar atividades na base de dados
echo "📊 Consultando atividades..."
ACTIVITIES_RESPONSE=$(curl -s http://localhost:5000/api/activities)
ACTIVITIES_COUNT=$(echo "$ACTIVITIES_RESPONSE" | grep -o '"id":[0-9]*' | wc -l)
echo "📊 Total de atividades: $ACTIVITIES_COUNT"

echo ""
echo "🔄 ÚLTIMAS ATIVIDADES:"
echo "$ACTIVITIES_RESPONSE" | head -c 2000
echo ""

echo ""
echo "🎯 TESTE SISTEMÁTICO COMPLETO FINALIZADO"
echo "=================================================================="

if [ $SUCCESS -eq $TOTAL ]; then
    echo "🏆 RESULTADO: TODOS OS TESTES PASSARAM!"
    exit 0
elif [ $SUCCESS -gt 0 ]; then
    echo "⚠️ RESULTADO: ALGUNS TESTES FALHARAM"
    exit 1
else
    echo "💥 RESULTADO: TODOS OS TESTES FALHARAM"
    exit 2
fi