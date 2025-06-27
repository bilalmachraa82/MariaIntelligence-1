/**
 * TESTE SISTEMÁTICO DE TODOS OS PDFs - MARIA FAZ
 * 
 * Este script testa CADA PDF individualmente e mapeia todos os cenários possíveis
 * Inclui análise especial de file(13) + file(14) como conjunto check-in/check-out
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Lista COMPLETA de todos os PDFs a testar
const ALL_PDFS = [
  // PDFs na raiz
  'Check-in Maria faz.pdf',
  'Check-outs Maria faz.pdf', 
  'Controlo_5 de Outubro (9).pdf',
  'Controlo_Aroeira I (6).pdf',
  'Controlo_Aroeira II (6).pdf',
  'Controlo_Feira da Ladra (Graça 1) (9).pdf',
  'Controlo_Sete Rios (9).pdf',
  'entrada.pdf',
  'saida.pdf',
  'file (13).pdf',
  'file (14).pdf',
  'file (2) (3).pdf',
  'file (3).pdf',
  'orcamento_familia_silva_9999.pdf',
  
  // PDFs em attached_assets (diferentes dos da raiz)
  'attached_assets/Controlo_Aroeira I.pdf',
  'attached_assets/Controlo_Aroeira II - Copy.pdf'
];

const testResults = {
  successful: [],
  failed: [],
  scenarios: {
    checkInOut: [],
    controlFiles: [],
    budgets: [],
    others: []
  }
};

/**
 * Testa um PDF específico
 */
async function testSinglePdf(pdfPath) {
  console.log(`\n🧪 TESTANDO: ${pdfPath}`);
  console.log('=' .repeat(60));
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`❌ ARQUIVO NÃO ENCONTRADO: ${pdfPath}`);
    return { success: false, error: 'File not found', path: pdfPath };
  }
  
  const startTime = Date.now();
  
  try {
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const response = await fetch('http://localhost:5000/api/pdf/upload-pdf', {
      method: 'POST',
      body: form,
      timeout: 60000 // 60 segundos timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    const processingTime = Date.now() - startTime;
    
    console.log(`📊 STATUS: ${result.success ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log(`⏱️ TEMPO: ${processingTime}ms`);
    
    if (result.success && result.extractedData) {
      console.log('📋 DADOS EXTRAÍDOS:');
      Object.entries(result.extractedData).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    if (result.error) {
      console.log(`⚠️ ERRO: ${result.error}`);
    }
    
    if (result.activityId) {
      console.log(`🗄️ ATIVIDADE CRIADA: ID ${result.activityId}`);
    }
    
    return {
      success: result.success,
      extractedData: result.extractedData,
      error: result.error,
      path: pdfPath,
      processingTime: processingTime,
      activityId: result.activityId,
      method: result.extractionMethod || 'unknown'
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.log(`❌ ERRO DE REDE: ${error.message}`);
    console.log(`⏱️ TEMPO ATÉ FALHA: ${processingTime}ms`);
    
    return {
      success: false,
      error: error.message,
      path: pdfPath,
      processingTime: processingTime
    };
  }
}

/**
 * Analisa file(13) e file(14) como cenário especial check-in/check-out
 */
async function analyzeCheckInOutScenario() {
  console.log('\n🔄 ANÁLISE ESPECIAL: FILE(13) + FILE(14) - CHECK-IN/CHECK-OUT');
  console.log('=' .repeat(70));
  
  const file13Path = 'file (13).pdf';
  const file14Path = 'file (14).pdf';
  
  // Testar file(13) - geralmente check-out
  console.log('\n📤 TESTANDO FILE(13) - ESPERADO: CHECK-OUT');
  const file13Result = await testSinglePdf(file13Path);
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // Pausa entre testes
  
  // Testar file(14) - geralmente check-in  
  console.log('\n📥 TESTANDO FILE(14) - ESPERADO: CHECK-IN');
  const file14Result = await testSinglePdf(file14Path);
  
  // Análise do cenário conjunto
  console.log('\n🔍 ANÁLISE DO CENÁRIO CHECK-IN/CHECK-OUT:');
  console.log('=' .repeat(50));
  
  const scenario = {
    file13: file13Result,
    file14: file14Result,
    canConsolidate: false,
    consolidationIssues: []
  };
  
  // Verificar se ambos foram processados com sucesso
  if (file13Result.success && file14Result.success) {
    console.log('✅ Ambos os arquivos processados com sucesso');
    
    // Verificar se há dados para consolidação
    const data13 = file13Result.extractedData || {};
    const data14 = file14Result.extractedData || {};
    
    // Verificar propriedade comum
    if (data13.propertyName && data14.propertyName) {
      if (data13.propertyName === data14.propertyName) {
        console.log(`✅ PROPRIEDADE COMUM: ${data13.propertyName}`);
        scenario.canConsolidate = true;
      } else {
        console.log(`⚠️ PROPRIEDADES DIFERENTES: ${data13.propertyName} vs ${data14.propertyName}`);
        scenario.consolidationIssues.push('Different properties');
      }
    }
    
    // Verificar referências
    if (data13.reference && data14.reference) {
      if (data13.reference === data14.reference) {
        console.log(`✅ REFERÊNCIA COMUM: ${data13.reference}`);
      } else {
        console.log(`⚠️ REFERÊNCIAS DIFERENTES: ${data13.reference} vs ${data14.reference}`);
        scenario.consolidationIssues.push('Different references');
      }
    }
    
    // Verificar datas
    if (data13.checkInDate && data14.checkInDate) {
      console.log(`📅 DATAS: ${data13.checkInDate} vs ${data14.checkInDate}`);
    }
    
  } else {
    console.log('❌ Um ou ambos os arquivos falharam no processamento');
    if (!file13Result.success) scenario.consolidationIssues.push(`File13 failed: ${file13Result.error}`);
    if (!file14Result.success) scenario.consolidationIssues.push(`File14 failed: ${file14Result.error}`);
  }
  
  testResults.scenarios.checkInOut.push(scenario);
  return scenario;
}

/**
 * Categoriza um PDF pelo nome
 */
function categorizePdf(pdfPath) {
  const fileName = path.basename(pdfPath).toLowerCase();
  
  if (fileName.includes('check-in') || fileName === 'file (13).pdf') {
    return 'check-in';
  }
  if (fileName.includes('check-out') || fileName === 'file (14).pdf') {
    return 'check-out';
  }
  if (fileName.includes('controlo')) {
    return 'control';
  }
  if (fileName.includes('entrada') || fileName.includes('saida')) {
    return 'entry-exit';
  }
  if (fileName.includes('orcamento')) {
    return 'budget';
  }
  return 'other';
}

/**
 * Executa todos os testes sistematicamente
 */
async function runSystematicTests() {
  console.log('🚀 INICIANDO TESTE SISTEMÁTICO DE TODOS OS PDFs');
  console.log('=' .repeat(70));
  console.log(`📋 TOTAL DE ARQUIVOS: ${ALL_PDFS.length}`);
  
  const startTime = Date.now();
  
  // 1. Primeiro teste especial: file(13) + file(14)
  const checkInOutScenario = await analyzeCheckInOutScenario();
  
  // 2. Testar todos os outros PDFs
  for (const pdfPath of ALL_PDFS) {
    // Pular file(13) e file(14) já testados
    if (pdfPath === 'file (13).pdf' || pdfPath === 'file (14).pdf') {
      continue;
    }
    
    const result = await testSinglePdf(pdfPath);
    
    if (result.success) {
      testResults.successful.push(result);
    } else {
      testResults.failed.push(result);
    }
    
    // Categorizar resultado
    const category = categorizePdf(pdfPath);
    switch (category) {
      case 'control':
        testResults.scenarios.controlFiles.push(result);
        break;
      case 'budget':
        testResults.scenarios.budgets.push(result);
        break;
      default:
        testResults.scenarios.others.push(result);
    }
    
    // Pausa entre testes para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 3. Adicionar file(13) e file(14) aos resultados
  if (checkInOutScenario.file13.success) {
    testResults.successful.push(checkInOutScenario.file13);
  } else {
    testResults.failed.push(checkInOutScenario.file13);
  }
  
  if (checkInOutScenario.file14.success) {
    testResults.successful.push(checkInOutScenario.file14);
  } else {
    testResults.failed.push(checkInOutScenario.file14);
  }
  
  const totalTime = Date.now() - startTime;
  
  // 4. Gerar relatório final
  await generateFinalReport(totalTime, checkInOutScenario);
}

/**
 * Gera relatório final completo
 */
async function generateFinalReport(totalTime, checkInOutScenario) {
  console.log('\n📊 RELATÓRIO FINAL SISTEMÁTICO');
  console.log('=' .repeat(70));
  
  const totalTested = testResults.successful.length + testResults.failed.length;
  const successRate = Math.round((testResults.successful.length / totalTested) * 100);
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`   📋 Total testado: ${totalTested}`);
  console.log(`   ✅ Sucessos: ${testResults.successful.length}`);
  console.log(`   ❌ Falhas: ${testResults.failed.length}`);
  console.log(`   📊 Taxa de sucesso: ${successRate}%`);
  console.log(`   ⏱️ Tempo total: ${Math.round(totalTime/1000)}s`);
  
  console.log(`\n📋 CENÁRIOS MAPEADOS:`);
  console.log(`   🔄 Check-in/out: ${checkInOutScenario.canConsolidate ? 'CONSOLIDÁVEL' : 'SEPARADO'}`);
  console.log(`   📝 Arquivos controle: ${testResults.scenarios.controlFiles.length}`);
  console.log(`   💰 Orçamentos: ${testResults.scenarios.budgets.length}`);
  console.log(`   📄 Outros: ${testResults.scenarios.others.length}`);
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ FALHAS DETALHADAS:`);
    testResults.failed.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${path.basename(failure.path)}: ${failure.error}`);
    });
  }
  
  console.log(`\n✅ SUCESSOS POR CATEGORIA:`);
  const successfulByCategory = {};
  testResults.successful.forEach(result => {
    const category = categorizePdf(result.path);
    successfulByCategory[category] = (successfulByCategory[category] || 0) + 1;
  });
  
  Object.entries(successfulByCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} arquivos`);
  });
  
  // Verificar estado da base de dados
  console.log(`\n🗄️ VERIFICANDO BASE DE DADOS:`);
  try {
    const activitiesResponse = await fetch('http://localhost:5000/api/activities');
    const activities = await activitiesResponse.json();
    console.log(`   📊 Atividades registadas: ${activities.activities?.length || 0}`);
    
    const latestActivities = activities.activities?.slice(0, 5) || [];
    console.log(`   🔄 Últimas 5 atividades:`);
    latestActivities.forEach(activity => {
      console.log(`     ID ${activity.id}: ${activity.description}`);
    });
  } catch (error) {
    console.log(`   ❌ Erro ao verificar BD: ${error.message}`);
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    totalTested,
    successful: testResults.successful.length,
    failed: testResults.failed.length,
    successRate,
    totalTime,
    scenarios: testResults.scenarios,
    checkInOutAnalysis: checkInOutScenario,
    detailedResults: testResults
  };
  
  const reportPath = `systematic-test-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Relatório salvo: ${reportPath}`);
  
  return report;
}

// Executar se chamado diretamente
if (require.main === module) {
  runSystematicTests()
    .then(() => {
      console.log('\n🎯 TESTE SISTEMÁTICO COMPLETO FINALIZADO');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 ERRO CRÍTICO:', error.message);
      process.exit(1);
    });
}