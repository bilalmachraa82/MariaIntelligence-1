import fetch from 'node-fetch';

/**
 * Teste aprimorado para diagnosticar o problema de envio de orçamentos
 * Este script tenta enviar um orçamento com dados completos e validação detalhada
 */
async function testQuotationSubmit() {
  console.log('=== TESTE DE ENVIO DE ORÇAMENTO SIMPLIFICADO ===');
  
  // Dados simplificados mas completos para o orçamento
  const quotationData = {
    // Informações do cliente (obrigatórias)
    clientName: "João Silva Teste",
    clientEmail: "joao.silva@teste.com",
    clientPhone: "912345678",
    
    // Propriedade (obrigatórias)
    propertyType: "apartment_t2",
    propertyAddress: "Rua Exemplo, 123, Lisboa",
    propertyArea: 75,
    exteriorArea: 10,
    
    // Características (opcionais, mas com valores explícitos)
    isDuplex: false,
    hasBBQ: true,
    hasGlassGarden: false,
    
    // Preços (obrigatórios)
    basePrice: "30",
    duplexSurcharge: "0",
    bbqSurcharge: "30",
    exteriorSurcharge: "0",
    glassGardenSurcharge: "0",
    additionalSurcharges: "30",
    totalPrice: "60",
    
    // Detalhes adicionais (opcionais)
    validUntil: "2025-05-25",
    notes: "Teste de envio de orçamento via script de diagnóstico",
    internalNotes: "Teste automático",
    
    // Status (obrigatório)
    status: "draft"
  };
  
  console.log('Dados a serem enviados:', JSON.stringify(quotationData, null, 2));
  
  try {
    // URL do serviço - usando o domínio real do Replit
    const apiUrl = 'https://f36c39e0-6cbc-49c5-89a4-4e3fe0a565ee-00-1fs9nqqookwyn.riker.replit.dev/api/quotations';
    console.log('Enviando para:', apiUrl);
    
    // Tentativa de envio
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quotationData),
    });
    
    // Verificar o tipo de conteúdo da resposta
    const contentType = response.headers.get('content-type');
    console.log('Tipo de conteúdo da resposta:', contentType);
    
    // Primeiro, vamos clonar a resposta antes de extrair o corpo (para evitar o erro 'body used already')
    const responseClone = response.clone();
    
    // Analisar resposta
    if (response.ok) {
      try {
        // Tentar converter para JSON
        const responseData = await response.json();
        console.log('✅ SUCESSO: Orçamento enviado com sucesso');
        console.log('Resposta:', JSON.stringify(responseData, null, 2));
      } catch (jsonError) {
        // Se não for JSON, mostrar o texto
        const responseText = await responseClone.text();
        console.log('✅ SUCESSO com resposta não-JSON:');
        console.log('Texto de resposta (primeiros 500 caracteres):', responseText.substring(0, 500));
      }
    } else {
      console.error('❌ ERRO: Falha ao enviar orçamento');
      console.error('Status:', response.status);
      
      try {
        // Tentar converter para JSON
        const responseData = await response.json();
        console.error('Resposta:', JSON.stringify(responseData, null, 2));
        
        // Análise detalhada de erros de validação
        if (responseData.errors) {
          console.error('=== ANÁLISE DE ERROS DE VALIDAÇÃO ===');
          const errorFields = Object.keys(responseData.errors).filter(k => k !== '_errors');
          console.error('Campos com erro:', errorFields);
          
          errorFields.forEach(field => {
            console.error(`Campo '${field}':`, responseData.errors[field]._errors);
          });
        }
      } catch (jsonError) {
        // Se não for JSON, mostrar o texto
        try {
          const responseText = await responseClone.text();
          console.error('Texto de resposta (primeiros 500 caracteres):', responseText.substring(0, 500));
        } catch (textError) {
          console.error('Não foi possível ler o corpo da resposta:', textError.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ ERRO DE EXECUÇÃO:', error.message);
  }
}

// Executar o teste
testQuotationSubmit();