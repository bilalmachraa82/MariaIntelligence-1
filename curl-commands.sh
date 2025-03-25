#!/bin/bash

# Diagnosticar API do servidor
echo "Verificando servidor Express..."
curl -I http://localhost:5000

# Testar API simples 
echo -e "\nTestando API de estatísticas..."
curl -X GET http://localhost:5000/api/statistics

# Testar API de orçamentos
echo -e "\nTestando API de orçamentos (GET)..."
curl -X GET http://localhost:5000/api/quotations

# Enviar orçamento mínimo para testar criação
echo -e "\nTestando API de orçamentos (POST)..."
curl -X POST http://localhost:5000/api/quotations \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Cliente Teste",
    "propertyType": "apartment_t0t1", 
    "propertyArea": 50,
    "exteriorArea": 0,
    "isDuplex": false,
    "hasBBQ": false,
    "hasGlassGarden": false,
    "basePrice": "20.00",
    "duplexSurcharge": "0.00",
    "bbqSurcharge": "0.00",
    "exteriorSurcharge": "0.00",
    "glassGardenSurcharge": "0.00",
    "additionalSurcharges": "0.00",
    "totalPrice": "20.00",
    "status": "draft",
    "validUntil": "2025-04-24"
  }'