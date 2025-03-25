/**
 * Teste aprimorado para diagnosticar o problema de envio de orçamentos
 * Este script tenta enviar um orçamento com dados completos e validação detalhada
 */

import fetch from 'node-fetch';
import util from 'util';

async function testQuotationSubmit() {
  console.log("=== TESTE DE ENVIO DE ORÇAMENTO ===");
  console.log("Criando dados de teste para orçamento...");
  
  try {
    // Dados de orçamento baseados no formulário - note as strings para valores numéricos
    const quotationData = {
      clientName: "João Silva",
      clientEmail: "joao.silva@exemplo.pt",
      clientPhone: "+351 912 345 678",
      propertyType: "apartment_t2",
      propertyAddress: "Av. da República, 123, Lisboa",
      propertyArea: 85,
      exteriorArea: 12,
      isDuplex: true,
      hasBBQ: true,
      hasGlassGarden: false,
      basePrice: "40.00",     // Valores formatados como string com 2 casas decimais
      duplexSurcharge: "50.00",
      bbqSurcharge: "30.00",
      exteriorSurcharge: "10.00",
      glassGardenSurcharge: "0.00",
      additionalSurcharges: "90.00", // Soma dos adicionais
      totalPrice: "130.00",    // Soma do base price + adicionais
      notes: "Orçamento para limpeza completa do apartamento incluindo áreas exteriores e churrasqueira.",
      internalNotes: "",
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Formato YYYY-MM-DD
      status: "draft"
    };
    
    console.log("Dados de orçamento preparados:");
    console.log(util.inspect(quotationData, { colors: true, depth: null }));
    
    console.log("\nEnviando requisição POST para /api/quotations...");
    
    // Enviar requisição para API - usando localhost diretamente no Replit
    const baseUrl = 'http://localhost:5000';
    console.log(`Usando URL base: ${baseUrl}`);
    
    const response = await fetch(`${baseUrl}/api/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });
    
    // Parse resposta como JSON
    const responseData = await response.json();
    
    console.log(`\nResposta da API (Status ${response.status}):`);
    console.log(util.inspect(responseData, { colors: true, depth: null }));
    
    if (response.ok) {
      console.log("\n✅ SUCESSO! Orçamento criado com sucesso.");
      
      // Se tivemos sucesso, testar a geração de PDF
      if (responseData.data && responseData.data.id) {
        console.log(`\nTentando gerar PDF para o orçamento #${responseData.data.id}...`);
        
        const pdfResponse = await fetch(`http://localhost:5000/api/quotations/${responseData.data.id}/pdf?mode=json`, {
          method: 'GET',
        });
        
        const pdfResponseData = await pdfResponse.json();
        
        console.log(`Resposta da API de PDF (Status ${pdfResponse.status}):`);
        console.log(util.inspect(pdfResponseData, { colors: true, depth: null }));
        
        if (pdfResponse.ok) {
          console.log(`\n✅ SUCESSO! PDF gerado em: ${pdfResponseData.pdfPath}`);
        } else {
          console.log("\n❌ FALHA ao gerar PDF.");
        }
      }
    } else {
      console.log("\n❌ FALHA ao criar orçamento.");
      
      // Diagnóstico detalhado do erro
      if (responseData.errors) {
        console.log("\nErros de validação encontrados:");
        
        // Percorrer e exibir erros de forma estruturada
        Object.entries(responseData.errors).forEach(([field, error]) => {
          if (field === '_errors') return;
          console.log(`Campo '${field}': ${JSON.stringify(error)}`);
        });
      }
    }
    
    return responseData;
  } catch (error) {
    console.error("\n❌ ERRO durante o teste:", error);
    return { error: error.message };
  }
}

// Executar teste de forma independente
testQuotationSubmit()
  .then(result => {
    console.log("\n=== TESTE CONCLUÍDO ===");
  })
  .catch(err => {
    console.error("Erro fatal:", err);
    process.exit(1);
  });