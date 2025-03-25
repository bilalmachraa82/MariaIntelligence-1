/**
 * Script de diagnóstico para a API de orçamentos
 * Este script testa a criação de um orçamento diretamente via API
 * 
 * @format ESM - Para executar: node test-api-quotation.js
 */

import fetch from 'node-fetch';

async function testQuotationAPI() {
  console.log("=== TESTE DE API DE ORÇAMENTOS ===");
  
  try {
    // Dados de orçamento exatamente como enviados pelo frontend, com tipos corretos
    const quotationData = {
      clientName: "João Silva",
      clientEmail: "joao.silva@exemplo.pt",
      clientPhone: "+351 912 345 678",
      propertyType: "apartment_t2",
      propertyAddress: "Av. da República, 123, Lisboa",
      propertyArea: 85,  // Valor numérico
      exteriorArea: 12,  // Valor numérico
      isDuplex: true,    // Booleano
      hasBBQ: true,      // Booleano
      hasGlassGarden: false, // Booleano
      basePrice: "40.00",     // String
      duplexSurcharge: "50.00", // String
      bbqSurcharge: "30.00",   // String
      exteriorSurcharge: "10.00", // String
      glassGardenSurcharge: "0.00", // String
      additionalSurcharges: "90.00", // String
      totalPrice: "130.00",    // String
      notes: "Orçamento para limpeza completa do apartamento incluindo áreas exteriores e churrasqueira.",
      internalNotes: "",
      validUntil: "2025-04-24", // Formato YYYY-MM-DD
      status: "draft"
    };
    
    console.log("\nENVIANDO ORÇAMENTO PARA API:");
    console.log(JSON.stringify(quotationData, null, 2));
    
    // Acessar diretamente a porta 5000 no servidor Express
    const response = await fetch('http://localhost:5000/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });
    
    // Analisar resposta
    const responseStatus = response.status;
    const responseData = await response.json();
    
    console.log(`\nRESPOSTA DA API (Status ${responseStatus}):`);
    console.log(JSON.stringify(responseData, null, 2));
    
    // Diagnóstico detalhado
    if (response.ok) {
      console.log("\n✅ SUCESSO! Orçamento criado com ID:", responseData.data.id);
      
      // Testar API de geração de PDF se o orçamento foi criado com sucesso
      console.log("\nTESTANDO GERAÇÃO DE PDF:");
      const pdfResponse = await fetch(`http://localhost:5000/api/quotations/${responseData.data.id}/pdf?mode=json`, {
        method: 'GET',
      });
      
      const pdfData = await pdfResponse.json();
      console.log(`Resposta da API de PDF (Status ${pdfResponse.status}):`);
      console.log(JSON.stringify(pdfData, null, 2));
      
      if (pdfResponse.ok) {
        console.log(`\n✅ SUCESSO! PDF gerado em: ${pdfData.pdfPath}`);
      } else {
        console.log("\n❌ FALHA ao gerar PDF.");
      }
    } else {
      console.log("\n❌ FALHA ao criar orçamento.");
      
      // Diagnóstico detalhado de erros de validação
      if (responseData.errors) {
        console.log("\nERROS DE VALIDAÇÃO ENCONTRADOS:");
        Object.entries(responseData.errors).forEach(([field, error]) => {
          if (field === '_errors') return;
          console.log(`• Campo '${field}': ${JSON.stringify(error)}`);
        });
      }
    }
    
    return { status: responseStatus, data: responseData };
  } catch (error) {
    console.error("\n❌ ERRO DE CONEXÃO:", error.message);
    if (error.code) {
      console.error(`Código de erro: ${error.code}`);
    }
    return { error: error.message };
  }
}

// Executar teste
testQuotationAPI().then(() => {
  console.log("\n=== TESTE CONCLUÍDO ===");
});