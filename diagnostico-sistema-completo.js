/**
 * Diagnóstico Completo do Sistema Maria Faz
 * Este script identifica problemas reais no OCR e base de dados
 * 
 * Testes:
 * 1. Conectividade da base de dados
 * 2. Funcionalidade dos serviços AI
 * 3. Processamento de PDF real
 * 4. Inserção na base de dados
 * 5. Validação end-to-end
 */

import fs from 'fs';
import path from 'path';

async function runDiagnostic() {
  console.log('🔍 Iniciando diagnóstico completo do sistema...\n');
  
  const results = {
    database: { status: 'PENDING', details: null },
    aiServices: { status: 'PENDING', details: null },
    pdfProcessing: { status: 'PENDING', details: null },
    endToEnd: { status: 'PENDING', details: null }
  };

  // 1. Teste de Base de Dados
  console.log('📊 1. Testando conectividade da base de dados...');
  try {
    const { storage } = await import('./server/storage.js');
    
    // Testar operações básicas
    const properties = await storage.getProperties();
    const owners = await storage.getOwners();
    const reservations = await storage.getReservations();
    
    results.database = {
      status: 'SUCCESS',
      details: {
        properties: properties?.length || 0,
        owners: owners?.length || 0,
        reservations: reservations?.length || 0,
        connection: 'PostgreSQL conectado'
      }
    };
    
    console.log(`✅ Base de dados: ${properties?.length || 0} propriedades, ${owners?.length || 0} proprietários, ${reservations?.length || 0} reservas`);
    
    // Testar propriedades específicas (Aroeira, etc.)
    const aroeiras = properties?.filter(p => p.name.toLowerCase().includes('aroeira')) || [];
    console.log(`   Propriedades Aroeira encontradas: ${aroeiras.length}`);
    
  } catch (dbError) {
    results.database = {
      status: 'FAILED',
      details: { error: dbError.message }
    };
    console.log(`❌ Erro na base de dados: ${dbError.message}`);
  }

  // 2. Teste dos Serviços AI
  console.log('\n🤖 2. Testando serviços de IA...');
  try {
    const { aiService } = await import('./server/services/ai-adapter.service.js');
    
    const aiStatus = {
      gemini: !!process.env.GOOGLE_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      rolm: !!process.env.HF_TOKEN
    };
    
    // Testar conexão Gemini
    if (aiStatus.gemini) {
      try {
        const geminiTest = await aiService.geminiService.testConnection();
        aiStatus.geminiWorking = geminiTest.success;
        console.log(`✅ Gemini: ${geminiTest.success ? 'Funcionando' : 'Falha'}`);
      } catch (e) {
        aiStatus.geminiWorking = false;
        console.log(`❌ Gemini: Erro - ${e.message}`);
      }
    } else {
      console.log('⚠️ Gemini: API key não configurada');
    }
    
    // Testar OpenRouter se disponível
    if (aiStatus.openrouter) {
      try {
        const openrouterTest = await aiService.openRouterService.testConnection();
        aiStatus.openrouterWorking = openrouterTest.success;
        console.log(`✅ OpenRouter: ${openrouterTest.success ? 'Funcionando' : 'Falha'}`);
      } catch (e) {
        aiStatus.openrouterWorking = false;
        console.log(`❌ OpenRouter: Erro - ${e.message}`);
      }
    } else {
      console.log('⚠️ OpenRouter: API key não configurada');
    }
    
    results.aiServices = {
      status: (aiStatus.geminiWorking || aiStatus.openrouterWorking) ? 'SUCCESS' : 'PARTIAL',
      details: aiStatus
    };
    
  } catch (aiError) {
    results.aiServices = {
      status: 'FAILED',
      details: { error: aiError.message }
    };
    console.log(`❌ Erro nos serviços AI: ${aiError.message}`);
  }

  // 3. Teste de Processamento de PDF
  console.log('\n📄 3. Testando processamento de PDF...');
  try {
    // Encontrar um PDF de teste
    const testPdfs = [
      './attached_assets/Controlo_5 de Outubro (9).pdf',
      './Controlo_Aroeira I (6).pdf',
      './entrada.pdf'
    ].filter(p => fs.existsSync(p));
    
    if (testPdfs.length === 0) {
      results.pdfProcessing = {
        status: 'SKIPPED',
        details: { reason: 'Nenhum PDF de teste encontrado' }
      };
      console.log('⚠️ Nenhum PDF de teste encontrado');
    } else {
      const testPdf = testPdfs[0];
      console.log(`   Testando com: ${path.basename(testPdf)}`);
      
      // Ler o PDF
      const pdfBuffer = fs.readFileSync(testPdf);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      // Testar extração de texto
      const { aiService } = await import('./server/services/ai-adapter.service.js');
      const extractedText = await aiService.extractTextFromPDF(pdfBase64);
      
      console.log(`✅ Texto extraído: ${extractedText.substring(0, 100)}...`);
      
      // Testar parsing de dados
      const parsedData = await aiService.parseReservationData(extractedText);
      
      results.pdfProcessing = {
        status: 'SUCCESS',
        details: {
          file: path.basename(testPdf),
          textLength: extractedText.length,
          parsedData: parsedData,
          hasGuestName: !!parsedData?.guestName,
          hasPropertyName: !!parsedData?.propertyName,
          hasDates: !!(parsedData?.checkInDate && parsedData?.checkOutDate)
        }
      };
      
      console.log(`✅ Dados extraídos: hóspede=${!!parsedData?.guestName}, propriedade=${!!parsedData?.propertyName}, datas=${!!(parsedData?.checkInDate && parsedData?.checkOutDate)}`);
    }
    
  } catch (pdfError) {
    results.pdfProcessing = {
      status: 'FAILED',
      details: { error: pdfError.message }
    };
    console.log(`❌ Erro no processamento PDF: ${pdfError.message}`);
  }

  // 4. Teste End-to-End (apenas se PDF processing funcionou)
  console.log('\n🔄 4. Testando fluxo completo...');
  if (results.pdfProcessing.status === 'SUCCESS' && results.pdfProcessing.details.parsedData) {
    try {
      const { storage } = await import('./server/storage.js');
      const parsedData = results.pdfProcessing.details.parsedData;
      
      // Testar matching de propriedade
      let propertyId = null;
      if (parsedData.propertyName) {
        const properties = await storage.getProperties();
        const matchedProperty = properties?.find(p => 
          p.name.toLowerCase().includes(parsedData.propertyName.toLowerCase()) ||
          parsedData.propertyName.toLowerCase().includes(p.name.toLowerCase())
        );
        propertyId = matchedProperty?.id;
        
        console.log(`   Propriedade "${parsedData.propertyName}" → ${matchedProperty ? `ID ${propertyId}` : 'Não encontrada'}`);
      }
      
      // Se temos dados válidos, testar inserção (modo dry-run)
      if (parsedData.guestName && parsedData.checkInDate && parsedData.checkOutDate) {
        // Verificar se já existe uma reserva similar
        const existingReservations = await storage.getReservations();
        const duplicate = existingReservations?.find(r => 
          r.guestName === parsedData.guestName &&
          r.checkInDate === parsedData.checkInDate
        );
        
        if (duplicate) {
          console.log(`   ⚠️ Reserva duplicada encontrada (ID: ${duplicate.id})`);
        } else {
          console.log(`   ✅ Reserva seria criada: ${parsedData.guestName} (${parsedData.checkInDate} - ${parsedData.checkOutDate})`);
        }
        
        results.endToEnd = {
          status: 'SUCCESS',
          details: {
            propertyMatched: !!propertyId,
            wouldCreateReservation: !duplicate,
            duplicate: !!duplicate
          }
        };
      } else {
        results.endToEnd = {
          status: 'PARTIAL',
          details: { reason: 'Dados insuficientes para criar reserva' }
        };
        console.log('   ⚠️ Dados insuficientes para criar reserva');
      }
      
    } catch (e2eError) {
      results.endToEnd = {
        status: 'FAILED',
        details: { error: e2eError.message }
      };
      console.log(`❌ Erro no teste end-to-end: ${e2eError.message}`);
    }
  } else {
    results.endToEnd = {
      status: 'SKIPPED',
      details: { reason: 'PDF processing falhou' }
    };
    console.log('   ⏭️ Saltado (PDF processing falhou)');
  }

  // Resumo final
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result.status === 'SUCCESS' ? '✅' : 
                 result.status === 'PARTIAL' ? '⚠️' : 
                 result.status === 'FAILED' ? '❌' : '⏭️';
    console.log(`${icon} ${test.toUpperCase()}: ${result.status}`);
  });
  
  console.log('\n🔧 RECOMENDAÇÕES:');
  
  // Problemas identificados e soluções
  const issues = [];
  const solutions = [];
  
  if (results.database.status === 'FAILED') {
    issues.push('Base de dados não conecta');
    solutions.push('Verificar DATABASE_URL e conectividade PostgreSQL');
  }
  
  if (results.aiServices.status === 'FAILED') {
    issues.push('Nenhum serviço AI funciona');
    solutions.push('Configurar GOOGLE_API_KEY ou OPENROUTER_API_KEY');
  }
  
  if (results.pdfProcessing.status === 'FAILED') {
    issues.push('Processamento PDF falha');
    solutions.push('Verificar serviços AI e dependências');
  }
  
  if (results.endToEnd.status === 'FAILED') {
    issues.push('Fluxo completo falha');
    solutions.push('Corrigir problemas anteriores primeiro');
  }
  
  if (issues.length === 0) {
    console.log('✅ Sistema está funcional! Possíveis melhorias:');
    console.log('   - Consolidar código OCR redundante');
    console.log('   - Melhorar error handling');
    console.log('   - Optimizar matching de propriedades');
  } else {
    console.log(`❌ ${issues.length} problema(s) identificado(s):`);
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
      console.log(`      → ${solutions[i]}`);
    });
  }
  
  return results;
}

// Executar diagnóstico
runDiagnostic().catch(console.error);