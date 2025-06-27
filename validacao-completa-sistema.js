/**
 * VALIDAÇÃO COMPLETA DO SISTEMA MARIA FAZ
 * 
 * Este script:
 * 1. Testa todos os PDFs disponíveis
 * 2. Valida a base de dados
 * 3. Identifica dados em falta
 * 4. Cria plano de ação
 */

import fs from 'fs';
import path from 'path';

async function validacaoCompletaSistema() {
  console.log('🚀 VALIDAÇÃO COMPLETA DO SISTEMA MARIA FAZ');
  console.log('==========================================');
  
  const resultados = {
    pdfsTestados: 0,
    pdfsComSucesso: 0,
    pdfsComFalha: 0,
    propriedadesIdentificadas: 0,
    hospedessExtracted: 0,
    dadosEmFalta: [],
    planoAcao: []
  };
  
  // 1. IDENTIFICAR TODOS OS PDFs
  console.log('\n📄 1. IDENTIFICANDO ARQUIVOS PDF:');
  
  const arquivosPdf = [];
  const files = fs.readdirSync('.');
  
  for (const file of files) {
    if (file.toLowerCase().endsWith('.pdf')) {
      arquivosPdf.push(file);
      console.log(`   📎 ${file}`);
    }
  }
  
  console.log(`\n✅ Encontrados ${arquivosPdf.length} arquivos PDF`);
  
  // 2. TESTAR CADA PDF INDIVIDUALMENTE
  console.log('\n🔍 2. TESTANDO PROCESSAMENTO DE PDFs:');
  console.log('=====================================');
  
  for (let i = 0; i < arquivosPdf.length; i++) {
    const arquivo = arquivosPdf[i];
    console.log(`\n📄 [${i+1}/${arquivosPdf.length}] Testando: ${arquivo}`);
    
    try {
      const fileBuffer = fs.readFileSync(arquivo);
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      formData.append('pdf', blob, arquivo);
      
      const response = await fetch('http://localhost:5000/api/pdf/upload-pdf', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      resultados.pdfsTestados++;
      
      if (result.success) {
        resultados.pdfsComSucesso++;
        console.log(`   ✅ Sucesso`);
        
        if (result.data?.propertyName) {
          console.log(`      🏠 Propriedade: ${result.data.propertyName}`);
          if (result.data.propertyId) {
            resultados.propriedadesIdentificadas++;
            console.log(`      🎯 ID Propriedade: ${result.data.propertyId}`);
          }
        }
        
        if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
          console.log(`      👤 Hóspede: ${result.data.guestName}`);
          resultados.hospedessExtracted++;
        }
        
        if (result.data?.checkInDate) {
          console.log(`      📅 Check-in: ${result.data.checkInDate}`);
        }
        
      } else {
        resultados.pdfsComFalha++;
        console.log(`   ❌ Falha: ${result.message}`);
        resultados.dadosEmFalta.push({
          arquivo,
          problema: result.message,
          tipo: 'processamento_falhou'
        });
      }
      
    } catch (error) {
      resultados.pdfsComFalha++;
      console.log(`   ❌ Erro: ${error.message}`);
      resultados.dadosEmFalta.push({
        arquivo,
        problema: error.message,
        tipo: 'erro_tecnico'
      });
    }
    
    // Aguardar entre processamentos
    if (i < arquivosPdf.length - 1) {
      console.log('   ⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // 3. VALIDAR BASE DE DADOS
  console.log('\n📊 3. VALIDANDO BASE DE DADOS:');
  console.log('===============================');
  
  try {
    // Propriedades
    const propertiesResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propertiesResponse.json();
    console.log(`🏠 Propriedades na base: ${properties.length}`);
    
    // Proprietários
    const ownersResponse = await fetch('http://localhost:5000/api/owners');
    const owners = await ownersResponse.json();
    console.log(`👥 Proprietários na base: ${owners.length}`);
    
    // Reservas
    const reservationsResponse = await fetch('http://localhost:5000/api/reservations');
    const reservations = await reservationsResponse.json();
    console.log(`📋 Reservas na base: ${reservations.length}`);
    
    // Atividades
    const activitiesResponse = await fetch('http://localhost:5000/api/activities');
    const activitiesData = await activitiesResponse.json();
    const activities = activitiesData.activities;
    console.log(`📝 Atividades na base: ${activities.length}`);
    
    // Análise das atividades
    const atividadesComPropriedade = activities.filter(a => a.entityId !== null).length;
    const atividadesSemPropriedade = activities.length - atividadesComPropriedade;
    
    console.log(`   ✅ Com propriedade identificada: ${atividadesComPropriedade}`);
    console.log(`   ❌ Sem propriedade identificada: ${atividadesSemPropriedade}`);
    
    const taxaSucesso = ((atividadesComPropriedade / activities.length) * 100).toFixed(1);
    console.log(`   📊 Taxa de sucesso atual: ${taxaSucesso}%`);
    
    // Identificar problemas nas atividades
    for (const activity of activities) {
      if (!activity.entityId) {
        resultados.dadosEmFalta.push({
          atividade: activity.id,
          problema: 'Propriedade não identificada',
          tipo: 'propriedade_faltando',
          dados: activity
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro ao validar base de dados: ${error.message}`);
  }
  
  // 4. GERAR RELATÓRIO FINAL
  console.log('\n📈 4. RELATÓRIO FINAL:');
  console.log('======================');
  
  console.log(`📄 PDFs processados: ${resultados.pdfsTestados}`);
  console.log(`✅ Sucessos: ${resultados.pdfsComSucesso}`);
  console.log(`❌ Falhas: ${resultados.pdfsComFalha}`);
  console.log(`🏠 Propriedades identificadas: ${resultados.propriedadesIdentificadas}`);
  console.log(`👤 Hóspedes extraídos: ${resultados.hospedessExtracted}`);
  
  const taxaSucessoPdfs = resultados.pdfsTestados > 0 ? 
    ((resultados.pdfsComSucesso / resultados.pdfsTestados) * 100).toFixed(1) : 0;
  console.log(`📊 Taxa de sucesso PDFs: ${taxaSucessoPdfs}%`);
  
  // 5. PLANO DE AÇÃO
  console.log('\n🎯 5. PLANO DE AÇÃO:');
  console.log('====================');
  
  if (resultados.dadosEmFalta.length > 0) {
    console.log(`❌ Identificados ${resultados.dadosEmFalta.length} problemas`);
    
    // Agrupar por tipo
    const problemasPorTipo = {};
    for (const problema of resultados.dadosEmFalta) {
      if (!problemasPorTipo[problema.tipo]) {
        problemasPorTipo[problema.tipo] = [];
      }
      problemasPorTipo[problema.tipo].push(problema);
    }
    
    // Criar plano específico
    console.log('\n📋 AÇÕES RECOMENDADAS:');
    
    if (problemasPorTipo.processamento_falhou) {
      console.log(`\n🔧 PRIORIDADE ALTA - PDFs que falharam (${problemasPorTipo.processamento_falhou.length}):`);
      for (const p of problemasPorTipo.processamento_falhou) {
        console.log(`   - ${p.arquivo}: ${p.problema}`);
      }
      resultados.planoAcao.push({
        prioridade: 'ALTA',
        acao: 'Revisar e corrigir processamento de PDFs específicos',
        arquivos: problemasPorTipo.processamento_falhou.map(p => p.arquivo)
      });
    }
    
    if (problemasPorTipo.propriedade_faltando) {
      console.log(`\n🏠 PRIORIDADE MÉDIA - Atividades sem propriedade (${problemasPorTipo.propriedade_faltando.length}):`);
      resultados.planoAcao.push({
        prioridade: 'MÉDIA',
        acao: 'Melhorar matching de propriedades ou adicionar aliases',
        quantidade: problemasPorTipo.propriedade_faltando.length
      });
    }
    
    if (problemasPorTipo.erro_tecnico) {
      console.log(`\n⚠️ PRIORIDADE ALTA - Erros técnicos (${problemasPorTipo.erro_tecnico.length}):`);
      for (const p of problemasPorTipo.erro_tecnico) {
        console.log(`   - ${p.arquivo}: ${p.problema}`);
      }
      resultados.planoAcao.push({
        prioridade: 'ALTA',
        acao: 'Corrigir erros técnicos no sistema',
        arquivos: problemasPorTipo.erro_tecnico.map(p => p.arquivo)
      });
    }
    
  } else {
    console.log('✅ Nenhum problema crítico identificado!');
  }
  
  // 6. RECOMENDAÇÕES FINAIS
  console.log('\n💡 6. RECOMENDAÇÕES FINAIS:');
  console.log('===========================');
  
  if (taxaSucessoPdfs >= 90) {
    console.log('🌟 EXCELENTE: Sistema funcionando muito bem!');
  } else if (taxaSucessoPdfs >= 70) {
    console.log('✅ BOM: Sistema funcional com algumas melhorias necessárias');
  } else if (taxaSucessoPdfs >= 50) {
    console.log('⚠️ MÉDIO: Sistema precisa de otimizações importantes');
  } else {
    console.log('❌ CRÍTICO: Sistema precisa de correções urgentes');
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS SUGERIDOS:');
  console.log('1. Corrigir PDFs que falharam');
  console.log('2. Melhorar matching de propriedades');
  console.log('3. Adicionar mais aliases para propriedades');
  console.log('4. Verificar qualidade de extração de nomes');
  console.log('5. Otimizar prompts para casos específicos');
  
  return resultados;
}

// Executar validação completa
console.log('🚀 Iniciando validação completa do sistema...\n');

validacaoCompletaSistema()
  .then(resultados => {
    console.log('\n✅ VALIDAÇÃO COMPLETA FINALIZADA!');
    console.log('==================================');
    
    // Salvar resultados em arquivo
    const relatorio = {
      timestamp: new Date().toISOString(),
      resultados,
      sistema: 'Maria Faz Property Management',
      versao: 'v4.2 - Correções Implementadas'
    };
    
    fs.writeFileSync('relatorio-validacao-completa.json', 
                     JSON.stringify(relatorio, null, 2));
    
    console.log('📄 Relatório salvo em: relatorio-validacao-completa.json');
  })
  .catch(error => {
    console.error('❌ Erro na validação:', error);
  });