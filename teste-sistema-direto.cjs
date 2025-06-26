/**
 * Teste direto do sistema usando Node.js nativo
 * Identifica problemas reais no OCR e base de dados
 */

const fs = require('fs');
const path = require('path');

async function testarSistema() {
  console.log('🔍 Teste Direto do Sistema Maria Faz\n');

  // 1. Verificar variáveis de ambiente
  console.log('🔧 1. Verificando configuração...');
  
  const config = {
    gemini: !!process.env.GOOGLE_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    database: !!process.env.DATABASE_URL,
    rolm: !!process.env.HF_TOKEN
  };
  
  console.log(`   Gemini API: ${config.gemini ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   OpenRouter API: ${config.openrouter ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   Database URL: ${config.database ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`   RolmOCR Token: ${config.rolm ? '✅ Configurada' : '❌ Não configurada'}`);

  // 2. Testar conectividade de APIs
  console.log('\n🌐 2. Testando conectividade das APIs...');
  
  if (config.gemini) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
      const models = await response.json();
      
      if (response.ok && models.models) {
        console.log(`   ✅ Gemini: ${models.models.length} modelos disponíveis`);
      } else {
        console.log(`   ❌ Gemini: ${models.error?.message || 'Erro desconhecido'}`);
      }
    } catch (e) {
      console.log(`   ❌ Gemini: Erro de conectividade - ${e.message}`);
    }
  }

  if (config.openrouter) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ OpenRouter: ${data.data?.length || 0} modelos disponíveis`);
      } else {
        console.log(`   ❌ OpenRouter: ${data.error?.message || 'Erro na API'}`);
      }
    } catch (e) {
      console.log(`   ❌ OpenRouter: Erro de conectividade - ${e.message}`);
    }
  }

  // 3. Testar base de dados via HTTP
  console.log('\n📊 3. Testando base de dados via API...');
  try {
    const dbTests = [
      { endpoint: '/api/properties', name: 'Propriedades' },
      { endpoint: '/api/owners', name: 'Proprietários' },
      { endpoint: '/api/reservations', name: 'Reservas' }
    ];

    for (const test of dbTests) {
      try {
        const response = await fetch(`http://localhost:5000${test.endpoint}`);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          console.log(`   ✅ ${test.name}: ${data.length} registos`);
          
          // Detalhes específicos para propriedades
          if (test.endpoint === '/api/properties') {
            const aroeiras = data.filter(p => p.name.toLowerCase().includes('aroeira'));
            console.log(`      → ${aroeiras.length} propriedades Aroeira encontradas`);
            
            if (aroeiras.length > 0) {
              aroeiras.forEach(p => console.log(`        - ${p.name} (ID: ${p.id})`));
            }
          }
          
        } else {
          console.log(`   ❌ ${test.name}: ${data.message || 'Erro na resposta'}`);
        }
      } catch (e) {
        console.log(`   ❌ ${test.name}: Erro de conectividade - ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`   ❌ Erro geral na base de dados: ${e.message}`);
  }

  // 4. Testar processamento de PDF via API
  console.log('\n📄 4. Testando processamento de PDF...');
  
  const testPdfs = [
    './Controlo_5 de Outubro (9).pdf',
    './Controlo_Aroeira I (6).pdf',
    './entrada.pdf'
  ].filter(p => fs.existsSync(p));

  if (testPdfs.length === 0) {
    console.log('   ⚠️ Nenhum PDF de teste encontrado');
  } else {
    const testPdf = testPdfs[0];
    console.log(`   📁 Testando com: ${path.basename(testPdf)}`);
    
    try {
      // Preparar form data
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      
      const fileBuffer = fs.readFileSync(testPdf);
      form.append('pdf', fileBuffer, {
        filename: path.basename(testPdf),
        contentType: 'application/pdf'
      });

      // Testar endpoint de OCR
      const response = await fetch('http://localhost:5000/api/upload-and-extract', {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('   ✅ PDF processado com sucesso');
        console.log(`      Propriedade: ${result.extractedData?.propertyName || 'N/A'}`);
        console.log(`      Hóspede: ${result.extractedData?.guestName || 'N/A'}`);
        console.log(`      Check-in: ${result.extractedData?.checkInDate || 'N/A'}`);
        console.log(`      Check-out: ${result.extractedData?.checkOutDate || 'N/A'}`);
        console.log(`      Status validação: ${result.validation?.status || 'N/A'}`);
        
        // Verificar se a propriedade foi encontrada
        if (result.extractedData?.propertyId) {
          console.log(`   ✅ Propriedade encontrada na BD (ID: ${result.extractedData.propertyId})`);
        } else {
          console.log('   ⚠️ Propriedade não encontrada na BD');
        }
        
      } else {
        console.log(`   ❌ Erro no processamento: ${result.message || 'Erro desconhecido'}`);
        if (result.error) {
          console.log(`      Detalhes: ${result.error}`);
        }
      }
      
    } catch (e) {
      console.log(`   ❌ Erro na chamada à API: ${e.message}`);
    }
  }

  // 5. Teste de criação de reserva
  console.log('\n💾 5. Testando criação de reserva...');
  
  // Obter primeira propriedade disponível
  try {
    const propertiesResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propertiesResponse.json();
    
    if (properties.length > 0) {
      const testProperty = properties[0];
      
      // Dados de teste para reserva
      const testReservation = {
        propertyId: testProperty.id,
        guestName: 'Teste Diagnóstico',
        checkInDate: '2025-01-15',
        checkOutDate: '2025-01-20',
        totalAmount: '100.00',
        numGuests: 2,
        source: 'test'
      };
      
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testReservation)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ Reserva de teste criada (ID: ${result.id})`);
        
        // Limpar teste - apagar a reserva criada
        const deleteResponse = await fetch(`http://localhost:5000/api/reservations/${result.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log('   🧹 Reserva de teste removida');
        }
        
      } else {
        console.log(`   ❌ Erro ao criar reserva: ${result.message || 'Erro desconhecido'}`);
      }
      
    } else {
      console.log('   ⚠️ Nenhuma propriedade disponível para teste');
    }
    
  } catch (e) {
    console.log(`   ❌ Erro no teste de reserva: ${e.message}`);
  }

  // Resumo e recomendações
  console.log('\n📋 RESUMO E RECOMENDAÇÕES:');
  console.log('='.repeat(50));
  
  if (!config.gemini && !config.openrouter) {
    console.log('❌ CRÍTICO: Nenhuma API de IA configurada');
    console.log('   → Configure GOOGLE_API_KEY ou OPENROUTER_API_KEY');
  } else if (config.gemini) {
    console.log('✅ IA: Gemini configurado (recomendado)');
  } else if (config.openrouter) {
    console.log('✅ IA: OpenRouter configurado (alternativa)');
  }
  
  if (!config.database) {
    console.log('❌ CRÍTICO: Base de dados não configurada');
    console.log('   → Configure DATABASE_URL');
  } else {
    console.log('✅ BD: PostgreSQL configurado');
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Corrigir configurações em falta');
  console.log('2. Testar com PDFs reais');
  console.log('3. Validar fluxo completo');
  console.log('4. Consolidar código OCR (remover redundâncias)');
}

// Executar teste
testarSistema().catch(console.error);