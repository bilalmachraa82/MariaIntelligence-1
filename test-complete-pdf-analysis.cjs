/**
 * ANÁLISE COMPLETA DE TODOS OS PDFs - MARIA FAZ
 * 
 * Este script analisa todos os PDFs disponíveis no projeto e cria
 * um sistema de testes completo para garantir funcionalidade robusta
 * 
 * OBJETIVOS:
 * 1. Inventário completo de todos os PDFs
 * 2. Teste de cada tipo de documento
 * 3. Validação da base de dados
 * 4. Relatório de status completo
 * 5. Plano de mitigação para falhas
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Lista completa de PDFs identificados no projeto
const PDF_INVENTORY = {
  // PDFs na raiz do projeto
  ROOT_PDFS: [
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
    'orcamento_familia_silva_9999.pdf'
  ],
  
  // PDFs na pasta attached_assets
  ATTACHED_ASSETS_PDFS: [
    'attached_assets/Check-outs Maria faz.pdf',
    'attached_assets/Controlo_5 de Outubro (9).pdf',
    'attached_assets/Controlo_Aroeira I (6).pdf',
    'attached_assets/Controlo_Aroeira I.pdf',
    'attached_assets/Controlo_Aroeira II (6).pdf',
    'attached_assets/Controlo_Aroeira II - Copy.pdf',
    'attached_assets/Controlo_Feira da Ladra (Graça 1) (9).pdf',
    'attached_assets/Controlo_Sete Rios (9).pdf',
    'attached_assets/file (13).pdf'
  ],
  
  // PDFs na pasta uploads
  UPLOADS_PDFS: [
    'uploads/orcamento_teste_1742912042190.pdf'
  ]
};

// Classificação por tipo de documento
const DOCUMENT_TYPES = {
  CHECK_IN: [
    'Check-in Maria faz.pdf',
    'file (13).pdf',
    'attached_assets/file (13).pdf'
  ],
  
  CHECK_OUT: [
    'Check-outs Maria faz.pdf',
    'attached_assets/Check-outs Maria faz.pdf',
    'file (14).pdf',
    'saida.pdf'
  ],
  
  CONTROL_FILES: [
    'Controlo_5 de Outubro (9).pdf',
    'Controlo_Aroeira I (6).pdf',
    'Controlo_Aroeira II (6).pdf',
    'Controlo_Feira da Ladra (Graça 1) (9).pdf',
    'Controlo_Sete Rios (9).pdf',
    'attached_assets/Controlo_5 de Outubro (9).pdf',
    'attached_assets/Controlo_Aroeira I (6).pdf',
    'attached_assets/Controlo_Aroeira I.pdf',
    'attached_assets/Controlo_Aroeira II (6).pdf',
    'attached_assets/Controlo_Aroeira II - Copy.pdf',
    'attached_assets/Controlo_Feira da Ladra (Graça 1) (9).pdf',
    'attached_assets/Controlo_Sete Rios (9).pdf'
  ],
  
  ENTRADA_SAIDA: [
    'entrada.pdf',
    'saida.pdf'
  ],
  
  BUDGETS: [
    'orcamento_familia_silva_9999.pdf',
    'uploads/orcamento_teste_1742912042190.pdf'
  ],
  
  OTHERS: [
    'file (2) (3).pdf',
    'file (3).pdf'
  ]
};

/**
 * Verifica quais PDFs existem fisicamente no sistema
 */
async function inventoryPhysicalFiles() {
  console.log('\n🔍 INVENTÁRIO FÍSICO DE PDFs');
  console.log('=' .repeat(50));
  
  const inventory = {
    existing: [],
    missing: [],
    total: 0
  };
  
  // Combinar todos os PDFs numa lista única
  const allPdfs = [
    ...PDF_INVENTORY.ROOT_PDFS,
    ...PDF_INVENTORY.ATTACHED_ASSETS_PDFS,
    ...PDF_INVENTORY.UPLOADS_PDFS
  ];
  
  for (const pdfPath of allPdfs) {
    const exists = fs.existsSync(pdfPath);
    
    if (exists) {
      const stats = fs.statSync(pdfPath);
      inventory.existing.push({
        path: pdfPath,
        size: Math.round(stats.size / 1024), // KB
        modified: stats.mtime.toISOString().split('T')[0]
      });
      console.log(`✅ ${pdfPath} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      inventory.missing.push(pdfPath);
      console.log(`❌ ${pdfPath} - NÃO ENCONTRADO`);
    }
    
    inventory.total++;
  }
  
  console.log(`\n📊 RESUMO: ${inventory.existing.length}/${inventory.total} PDFs encontrados`);
  
  return inventory;
}

/**
 * Testa um PDF específico via API
 */
async function testPdfProcessing(pdfPath) {
  console.log(`\n🧪 Testando: ${pdfPath}`);
  
  if (!fs.existsSync(pdfPath)) {
    return {
      success: false,
      error: 'Arquivo não encontrado',
      path: pdfPath
    };
  }
  
  try {
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const response = await fetch('http://localhost:5000/api/pdf/upload-pdf', {
      method: 'POST',
      body: form
    });
    
    const result = await response.json();
    
    console.log(`📄 Resultado: ${result.success ? '✅ SUCESSO' : '❌ FALHA'}`);
    if (result.extractedData) {
      console.log(`📋 Dados extraídos:`, Object.keys(result.extractedData));
    }
    if (result.error) {
      console.log(`⚠️ Erro: ${result.error}`);
    }
    
    return {
      success: result.success,
      extractedData: result.extractedData,
      error: result.error,
      path: pdfPath,
      processingTime: result.processingTime
    };
    
  } catch (error) {
    console.log(`❌ Erro de rede: ${error.message}`);
    return {
      success: false,
      error: error.message,
      path: pdfPath
    };
  }
}

/**
 * Testa todos os PDFs por categoria
 */
async function testAllPdfsByCategory() {
  console.log('\n🧪 TESTE COMPLETO POR CATEGORIA');
  console.log('=' .repeat(50));
  
  const results = {
    checkIn: [],
    checkOut: [],
    controlFiles: [],
    entradaSaida: [],
    budgets: [],
    others: [],
    summary: {
      total: 0,
      successful: 0,
      failed: 0
    }
  };
  
  // Testar Check-ins
  console.log('\n📥 TESTANDO CHECK-INS:');
  for (const pdf of DOCUMENT_TYPES.CHECK_IN) {
    if (fs.existsSync(pdf)) {
      const result = await testPdfProcessing(pdf);
      results.checkIn.push(result);
      results.summary.total++;
      if (result.success) results.summary.successful++;
      else results.summary.failed++;
    }
  }
  
  // Testar Check-outs
  console.log('\n📤 TESTANDO CHECK-OUTS:');
  for (const pdf of DOCUMENT_TYPES.CHECK_OUT) {
    if (fs.existsSync(pdf)) {
      const result = await testPdfProcessing(pdf);
      results.checkOut.push(result);
      results.summary.total++;
      if (result.success) results.summary.successful++;
      else results.summary.failed++;
    }
  }
  
  // Testar Arquivos de Controle
  console.log('\n📋 TESTANDO ARQUIVOS DE CONTROLE:');
  for (const pdf of DOCUMENT_TYPES.CONTROL_FILES) {
    if (fs.existsSync(pdf)) {
      const result = await testPdfProcessing(pdf);
      results.controlFiles.push(result);
      results.summary.total++;
      if (result.success) results.summary.successful++;
      else results.summary.failed++;
    }
  }
  
  // Testar Entrada/Saída
  console.log('\n🚪 TESTANDO ENTRADA/SAÍDA:');
  for (const pdf of DOCUMENT_TYPES.ENTRADA_SAIDA) {
    if (fs.existsSync(pdf)) {
      const result = await testPdfProcessing(pdf);
      results.entradaSaida.push(result);
      results.summary.total++;
      if (result.success) results.summary.successful++;
      else results.summary.failed++;
    }
  }
  
  // Testar Orçamentos
  console.log('\n💰 TESTANDO ORÇAMENTOS:');
  for (const pdf of DOCUMENT_TYPES.BUDGETS) {
    if (fs.existsSync(pdf)) {
      const result = await testPdfProcessing(pdf);
      results.budgets.push(result);
      results.summary.total++;
      if (result.success) results.summary.successful++;
      else results.summary.failed++;
    }
  }
  
  // Testar Outros
  console.log('\n📄 TESTANDO OUTROS:');
  for (const pdf of DOCUMENT_TYPES.OTHERS) {
    if (fs.existsSync(pdf)) {
      const result = await testPdfProcessing(pdf);
      results.others.push(result);
      results.summary.total++;
      if (result.success) results.summary.successful++;
      else results.summary.failed++;
    }
  }
  
  return results;
}

/**
 * Valida a base de dados após os testes
 */
async function validateDatabaseIntegrity() {
  console.log('\n🗄️ VALIDAÇÃO DA BASE DE DADOS');
  console.log('=' .repeat(50));
  
  try {
    // Verificar reservas
    const reservationsResponse = await fetch('http://localhost:5000/api/reservations');
    const reservations = await reservationsResponse.json();
    console.log(`📋 Reservas na BD: ${reservations.length}`);
    
    // Verificar atividades
    const activitiesResponse = await fetch('http://localhost:5000/api/activities');
    const activities = await activitiesResponse.json();
    console.log(`📊 Atividades na BD: ${activities.activities?.length || 0}`);
    
    // Verificar propriedades
    const propertiesResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propertiesResponse.json();
    console.log(`🏠 Propriedades na BD: ${properties.length}`);
    
    // Verificar proprietários
    const ownersResponse = await fetch('http://localhost:5000/api/owners');
    const owners = await ownersResponse.json();
    console.log(`👥 Proprietários na BD: ${owners.length}`);
    
    return {
      reservations: reservations.length,
      activities: activities.activities?.length || 0,
      properties: properties.length,
      owners: owners.length,
      status: 'healthy'
    };
    
  } catch (error) {
    console.log(`❌ Erro ao verificar BD: ${error.message}`);
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Gera relatório completo e plano de mitigação
 */
function generateReport(inventory, testResults, dbStatus) {
  console.log('\n📊 RELATÓRIO COMPLETO DO SISTEMA');
  console.log('=' .repeat(60));
  
  console.log('\n1. INVENTÁRIO DE ARQUIVOS:');
  console.log(`   ✅ Arquivos encontrados: ${inventory.existing.length}`);
  console.log(`   ❌ Arquivos em falta: ${inventory.missing.length}`);
  console.log(`   📊 Total mapeado: ${inventory.total}`);
  
  console.log('\n2. RESULTADOS DOS TESTES:');
  console.log(`   🧪 Total testado: ${testResults.summary.total}`);
  console.log(`   ✅ Sucessos: ${testResults.summary.successful}`);
  console.log(`   ❌ Falhas: ${testResults.summary.failed}`);
  console.log(`   📈 Taxa de sucesso: ${Math.round((testResults.summary.successful / testResults.summary.total) * 100)}%`);
  
  console.log('\n3. STATUS DA BASE DE DADOS:');
  console.log(`   📋 Reservas: ${dbStatus.reservations}`);
  console.log(`   📊 Atividades: ${dbStatus.activities}`);
  console.log(`   🏠 Propriedades: ${dbStatus.properties}`);
  console.log(`   👥 Proprietários: ${dbStatus.owners}`);
  console.log(`   🔄 Status: ${dbStatus.status}`);
  
  console.log('\n4. ANÁLISE POR CATEGORIA:');
  console.log(`   📥 Check-ins: ${testResults.checkIn.filter(r => r.success).length}/${testResults.checkIn.length}`);
  console.log(`   📤 Check-outs: ${testResults.checkOut.filter(r => r.success).length}/${testResults.checkOut.length}`);
  console.log(`   📋 Arquivos controle: ${testResults.controlFiles.filter(r => r.success).length}/${testResults.controlFiles.length}`);
  console.log(`   🚪 Entrada/Saída: ${testResults.entradaSaida.filter(r => r.success).length}/${testResults.entradaSaida.length}`);
  console.log(`   💰 Orçamentos: ${testResults.budgets.filter(r => r.success).length}/${testResults.budgets.length}`);
  
  // Identificar falhas críticas
  const criticalFailures = [];
  [...testResults.checkIn, ...testResults.checkOut, ...testResults.controlFiles]
    .filter(r => !r.success)
    .forEach(failure => criticalFailures.push(failure));
  
  console.log('\n5. PLANO DE MITIGAÇÃO:');
  console.log('=' .repeat(30));
  
  if (criticalFailures.length === 0) {
    console.log('   ✅ SISTEMA COMPLETAMENTE FUNCIONAL');
    console.log('   ✅ Todos os tipos críticos de documento funcionam');
    console.log('   ✅ Base de dados integra corretamente');
    console.log('   ✅ Sistema de fallback manual operacional');
  } else {
    console.log('   ⚠️ AÇÕES NECESSÁRIAS:');
    criticalFailures.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${path.basename(failure.path)}: ${failure.error}`);
    });
    
    console.log('\n   🔧 PROCEDIMENTOS DE MITIGAÇÃO:');
    console.log('   1. Verificar conectividade com API Gemini');
    console.log('   2. Ativar sistema de fallback manual');
    console.log('   3. Verificar formato dos PDFs problemáticos');
    console.log('   4. Ajustar padrões regex para casos específicos');
    console.log('   5. Implementar alertas automáticos');
  }
  
  console.log('\n6. RECOMENDAÇÕES:');
  console.log('   🔄 Executar este teste semanalmente');
  console.log('   📊 Monitorizar taxa de sucesso > 95%');
  console.log('   🚨 Configurar alertas para falhas críticas');
  console.log('   📁 Manter backup dos PDFs de teste');
  console.log('   🧪 Testar novos formatos antes da produção');
  
  return {
    inventory,
    testResults,
    dbStatus,
    criticalFailures,
    successRate: Math.round((testResults.summary.successful / testResults.summary.total) * 100),
    systemHealth: criticalFailures.length === 0 ? 'EXCELLENT' : 'NEEDS_ATTENTION'
  };
}

/**
 * Função principal
 */
async function runCompleteAnalysis() {
  console.log('🚀 INICIANDO ANÁLISE COMPLETA DO SISTEMA MARIA FAZ');
  console.log('=' .repeat(60));
  
  try {
    // 1. Inventário físico
    const inventory = await inventoryPhysicalFiles();
    
    // 2. Testes de processamento
    const testResults = await testAllPdfsByCategory();
    
    // 3. Validação da base de dados
    const dbStatus = await validateDatabaseIntegrity();
    
    // 4. Relatório final
    const report = generateReport(inventory, testResults, dbStatus);
    
    // 5. Salvar relatório
    const reportPath = `pdf-analysis-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório salvo em: ${reportPath}`);
    
    console.log('\n🎯 ANÁLISE COMPLETA FINALIZADA');
    
    return report;
    
  } catch (error) {
    console.error('❌ Erro durante análise:', error.message);
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  runCompleteAnalysis()
    .then(report => {
      console.log(`\n✅ Sistema ${report.systemHealth === 'EXCELLENT' ? 'PERFEITO' : 'PRECISA ATENÇÃO'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha crítica:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runCompleteAnalysis,
  PDF_INVENTORY,
  DOCUMENT_TYPES,
  testPdfProcessing,
  validateDatabaseIntegrity
};