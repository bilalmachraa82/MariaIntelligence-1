/**
 * TESTE SISTEMÁTICO COMPLETO - VALIDAÇÃO TOTAL DO SISTEMA
 * Este script testa TODOS os PDFs e valida a integridade da base de dados
 * 
 * Objetivos:
 * 1. Testar processamento de TODOS os arquivos PDF
 * 2. Validar dados na base de dados após cada processamento
 * 3. Identificar lacunas ou dados em falta
 * 4. Criar plano de ação para correções necessárias
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Configuração
const BASE_URL = 'http://localhost:5000';
const PDF_DIRECTORY = '.';

// Contadores e estatísticas
let stats = {
  totalPdfs: 0,
  processedSuccessfully: 0,
  processingErrors: 0,
  dataValidationIssues: 0,
  missingProperties: [],
  duplicateReservations: [],
  incompleteExtractions: []
};

/**
 * Encontra todos os arquivos PDF no diretório
 */
function findAllPdfs() {
  const files = fs.readdirSync(PDF_DIRECTORY);
  return files.filter(file => 
    file.toLowerCase().endsWith('.pdf') && 
    !file.startsWith('.')
  ).sort();
}

/**
 * Testa o processamento de um PDF via API
 */
async function testPdfProcessing(filename) {
  try {
    console.log(`\n📄 TESTANDO: ${filename}`);
    console.log('=' .repeat(50));
    
    const filePath = path.join(PDF_DIRECTORY, filename);
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(filePath));
    
    const response = await fetch(`${BASE_URL}/api/pdf/upload-pdf`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Processamento concluído');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    
    // Validar resultado
    await validateProcessingResult(filename, result);
    
    stats.processedSuccessfully++;
    return result;
    
  } catch (error) {
    console.log(`❌ ERRO no processamento de ${filename}:`, error.message);
    stats.processingErrors++;
    return { error: error.message, filename };
  }
}

/**
 * Valida o resultado do processamento
 */
async function validateProcessingResult(filename, result) {
  console.log('\n🔍 VALIDANDO RESULTADO...');
  
  // Verificar se dados essenciais foram extraídos
  if (result.success) {
    if (result.data) {
      const data = result.data;
      
      // Validar propriedade
      if (!data.property_id) {
        console.log('⚠️ AVISO: Propriedade não identificada');
        stats.missingProperties.push({
          filename,
          extractedName: data.propertyName || 'N/A'
        });
      } else {
        console.log(`✅ Propriedade identificada: ID ${data.property_id}`);
      }
      
      // Validar dados do hóspede
      if (!data.guest_name) {
        console.log('⚠️ AVISO: Nome do hóspede não extraído');
        stats.incompleteExtractions.push({
          filename,
          issue: 'Nome do hóspede em falta'
        });
      } else {
        console.log(`✅ Hóspede: ${data.guest_name}`);
      }
      
      // Validar datas
      if (!data.check_in_date || !data.check_out_date) {
        console.log('⚠️ AVISO: Datas incompletas');
        stats.incompleteExtractions.push({
          filename,
          issue: 'Datas de check-in/out em falta'
        });
      } else {
        console.log(`✅ Datas: ${data.check_in_date} → ${data.check_out_date}`);
      }
      
    } else {
      console.log('⚠️ AVISO: Resultado de sucesso mas sem dados');
      stats.dataValidationIssues++;
    }
  } else {
    console.log('❌ Processamento reportado como falhado');
    stats.dataValidationIssues++;
  }
}

/**
 * Verifica estado atual da base de dados
 */
async function validateDatabaseState() {
  console.log('\n🗄️ VALIDANDO ESTADO DA BASE DE DADOS');
  console.log('=' .repeat(50));
  
  try {
    // Verificar propriedades
    const propertiesResponse = await fetch(`${BASE_URL}/api/properties`);
    const properties = await propertiesResponse.json();
    console.log(`📊 Propriedades na BD: ${properties.length}`);
    
    // Verificar proprietários
    const ownersResponse = await fetch(`${BASE_URL}/api/owners`);
    const owners = await ownersResponse.json();
    console.log(`👥 Proprietários na BD: ${owners.length}`);
    
    // Verificar reservas
    const reservationsResponse = await fetch(`${BASE_URL}/api/reservations`);
    const reservations = await reservationsResponse.json();
    console.log(`📋 Reservas na BD: ${reservations.length}`);
    
    // Verificar atividades
    const activitiesResponse = await fetch(`${BASE_URL}/api/activities`);
    const activities = await activitiesResponse.json();
    console.log(`📝 Atividades na BD: ${activities.length}`);
    
    // Analisar propriedades sem aliases
    const propertiesWithoutAliases = properties.filter(p => !p.aliases || p.aliases.length === 0);
    if (propertiesWithoutAliases.length > 0) {
      console.log(`⚠️ ${propertiesWithoutAliases.length} propriedades sem aliases:`);
      propertiesWithoutAliases.forEach(p => console.log(`   - ${p.name}`));
    }
    
    return {
      properties: properties.length,
      owners: owners.length,
      reservations: reservations.length,
      activities: activities.length,
      propertiesWithoutAliases: propertiesWithoutAliases.length
    };
    
  } catch (error) {
    console.log('❌ ERRO ao validar base de dados:', error.message);
    return null;
  }
}

/**
 * Gera relatório final e plano de ação
 */
function generateActionPlan() {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL DO TESTE SISTEMÁTICO');
  console.log('=' .repeat(60));
  
  console.log('\n📈 ESTATÍSTICAS GERAIS:');
  console.log(`   Total de PDFs testados: ${stats.totalPdfs}`);
  console.log(`   Processados com sucesso: ${stats.processedSuccessfully}`);
  console.log(`   Erros de processamento: ${stats.processingErrors}`);
  console.log(`   Problemas de validação: ${stats.dataValidationIssues}`);
  
  const successRate = ((stats.processedSuccessfully / stats.totalPdfs) * 100).toFixed(1);
  console.log(`   Taxa de sucesso: ${successRate}%`);
  
  // Identificar problemas
  let actionItems = [];
  
  if (stats.missingProperties.length > 0) {
    console.log('\n⚠️ PROPRIEDADES NÃO IDENTIFICADAS:');
    stats.missingProperties.forEach(item => {
      console.log(`   - ${item.filename}: "${item.extractedName}"`);
    });
    actionItems.push(`Adicionar aliases para ${stats.missingProperties.length} propriedades não identificadas`);
  }
  
  if (stats.incompleteExtractions.length > 0) {
    console.log('\n⚠️ EXTRAÇÕES INCOMPLETAS:');
    stats.incompleteExtractions.forEach(item => {
      console.log(`   - ${item.filename}: ${item.issue}`);
    });
    actionItems.push(`Melhorar regex de extração para ${stats.incompleteExtractions.length} casos incompletos`);
  }
  
  if (stats.processingErrors > 0) {
    actionItems.push(`Investigar e corrigir ${stats.processingErrors} erros de processamento`);
  }
  
  // Plano de ação
  console.log('\n🎯 PLANO DE AÇÃO:');
  if (actionItems.length === 0) {
    console.log('   ✅ Nenhuma ação necessária - Sistema funcionando perfeitamente!');
  } else {
    actionItems.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action}`);
    });
  }
  
  return actionItems;
}

/**
 * Espera alguns segundos para permitir processamento assíncrono
 */
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Função principal
 */
async function runSystematicTest() {
  console.log('🚀 INICIANDO TESTE SISTEMÁTICO COMPLETO');
  console.log('Objetivo: Validar TODOS os PDFs e verificar integridade da base de dados');
  
  // Validar estado inicial da base de dados
  const initialDbState = await validateDatabaseState();
  
  // Encontrar todos os PDFs
  const pdfFiles = findAllPdfs();
  stats.totalPdfs = pdfFiles.length;
  
  console.log(`\n📁 Encontrados ${pdfFiles.length} arquivos PDF para testar:`);
  pdfFiles.forEach(file => console.log(`   - ${file}`));
  
  if (pdfFiles.length === 0) {
    console.log('❌ Nenhum arquivo PDF encontrado!');
    return;
  }
  
  // Processar cada PDF
  console.log('\n🔄 INICIANDO PROCESSAMENTO DOS PDFs...');
  const results = [];
  
  for (const filename of pdfFiles) {
    const result = await testPdfProcessing(filename);
    results.push(result);
    
    // Aguardar um pouco entre processamentos para evitar sobrecarga
    await sleep(2);
  }
  
  // Validar estado final da base de dados
  console.log('\n🔄 Aguardando processamento assíncrono...');
  await sleep(10);
  
  const finalDbState = await validateDatabaseState();
  
  // Comparar estados
  if (initialDbState && finalDbState) {
    console.log('\n📊 COMPARAÇÃO DE ESTADOS DA BASE DE DADOS:');
    console.log(`   Reservas: ${initialDbState.reservations} → ${finalDbState.reservations} (+${finalDbState.reservations - initialDbState.reservations})`);
    console.log(`   Atividades: ${initialDbState.activities} → ${finalDbState.activities} (+${finalDbState.activities - initialDbState.activities})`);
  }
  
  // Gerar plano de ação
  const actionPlan = generateActionPlan();
  
  // Salvar relatório detalhado
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    results,
    initialDbState,
    finalDbState,
    actionPlan
  };
  
  fs.writeFileSync('relatorio-teste-sistematico.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Relatório detalhado salvo em: relatorio-teste-sistematico.json');
  
  console.log('\n✅ TESTE SISTEMÁTICO CONCLUÍDO!');
}

// Executar teste
runSystematicTest().catch(console.error);