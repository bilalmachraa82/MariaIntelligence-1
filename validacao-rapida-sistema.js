/**
 * VALIDAÇÃO RÁPIDA E EFICIENTE DO SISTEMA
 * Testa arquivos principais e valida base de dados
 */

import fs from 'fs';

async function validacaoRapida() {
  console.log('🚀 VALIDAÇÃO RÁPIDA DO SISTEMA MARIA FAZ');
  console.log('=======================================');
  
  const resultados = {
    totalPdfs: 0,
    sucessos: 0,
    falhas: 0,
    propriedadesId: 0,
    hospedes: 0,
    problemas: []
  };
  
  // PDFs principais para testar
  const pdfsImportantes = [
    'Check-in Maria faz.pdf',
    'control1.pdf',
    'control2.pdf',
    'entrada.pdf',
    'file (13).pdf'
  ];
  
  console.log('\n📄 TESTANDO ARQUIVOS PRINCIPAIS:');
  console.log('================================');
  
  for (const arquivo of pdfsImportantes) {
    if (fs.existsSync(arquivo)) {
      console.log(`\n📄 Testando: ${arquivo}`);
      
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
        resultados.totalPdfs++;
        
        if (result.success) {
          resultados.sucessos++;
          console.log(`   ✅ Processado com sucesso`);
          
          if (result.data?.propertyId) {
            resultados.propriedadesId++;
            console.log(`   🏠 Propriedade: ${result.data.propertyName} (ID: ${result.data.propertyId})`);
          } else if (result.data?.propertyName) {
            console.log(`   🏠 Propriedade: ${result.data.propertyName} (SEM ID)`);
          }
          
          if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
            resultados.hospedes++;
            console.log(`   👤 Hóspede: ${result.data.guestName}`);
          }
          
        } else {
          resultados.falhas++;
          console.log(`   ❌ Falha: ${result.message}`);
          resultados.problemas.push({ arquivo, erro: result.message });
        }
        
      } catch (error) {
        resultados.falhas++;
        console.log(`   ❌ Erro técnico: ${error.message}`);
        resultados.problemas.push({ arquivo, erro: error.message });
      }
      
      // Pausa pequena entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`   ⚠️ Arquivo não encontrado: ${arquivo}`);
    }
  }
  
  // VALIDAR BASE DE DADOS
  console.log('\n📊 VALIDANDO BASE DE DADOS:');
  console.log('===========================');
  
  try {
    // Verificar APIs principais
    const endpoints = {
      properties: '/api/properties',
      owners: '/api/owners', 
      reservations: '/api/reservations',
      activities: '/api/activities'
    };
    
    const dadosBd = {};
    
    for (const [nome, endpoint] of Object.entries(endpoints)) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`);
        const data = await response.json();
        
        if (nome === 'activities') {
          dadosBd[nome] = data.activities || [];
        } else {
          dadosBd[nome] = data || [];
        }
        
        console.log(`📋 ${nome}: ${dadosBd[nome].length} registos`);
        
      } catch (error) {
        console.log(`❌ Erro ao consultar ${nome}: ${error.message}`);
        dadosBd[nome] = [];
      }
    }
    
    // Análise das atividades
    const atividades = dadosBd.activities;
    const comPropriedade = atividades.filter(a => a.entityId !== null).length;
    const semPropriedade = atividades.length - comPropriedade;
    const taxaId = atividades.length > 0 ? ((comPropriedade / atividades.length) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 ANÁLISE DE ATIVIDADES:`);
    console.log(`   ✅ Com propriedade identificada: ${comPropriedade}`);
    console.log(`   ❌ Sem propriedade identificada: ${semPropriedade}`);
    console.log(`   📊 Taxa de identificação: ${taxaId}%`);
    
    resultados.basesDados = {
      propriedades: dadosBd.properties.length,
      proprietarios: dadosBd.owners.length,
      reservas: dadosBd.reservations.length,
      atividades: dadosBd.activities.length,
      taxaIdentificacao: parseFloat(taxaId),
      atividadesComId: comPropriedade,
      atividadesSemId: semPropriedade
    };
    
  } catch (error) {
    console.log(`❌ Erro na validação da base de dados: ${error.message}`);
  }
  
  // RELATÓRIO FINAL
  console.log('\n🎯 RELATÓRIO FINAL:');
  console.log('==================');
  
  const taxaSucessoPdf = resultados.totalPdfs > 0 ? 
    ((resultados.sucessos / resultados.totalPdfs) * 100).toFixed(1) : 0;
  
  console.log(`📄 PDFs testados: ${resultados.totalPdfs}`);
  console.log(`✅ Sucessos: ${resultados.sucessos}`);
  console.log(`❌ Falhas: ${resultados.falhas}`);
  console.log(`📊 Taxa de sucesso: ${taxaSucessoPdf}%`);
  console.log(`🏠 Propriedades identificadas: ${resultados.propriedadesId}/${resultados.totalPdfs}`);
  console.log(`👤 Hóspedes extraídos: ${resultados.hospedes}/${resultados.totalPdfs}`);
  
  // PLANO DE AÇÃO
  console.log('\n📋 PLANO DE AÇÃO:');
  console.log('=================');
  
  if (resultados.problemas.length > 0) {
    console.log(`❌ PROBLEMAS IDENTIFICADOS (${resultados.problemas.length}):`);
    for (const problema of resultados.problemas) {
      console.log(`   - ${problema.arquivo}: ${problema.erro}`);
    }
    
    console.log('\n🔧 AÇÕES RECOMENDADAS:');
    console.log('   1. Corrigir PDFs que falharam');
    console.log('   2. Verificar logs detalhados dos erros');
    console.log('   3. Ajustar prompts se necessário');
  }
  
  if (resultados.basesDados && resultados.basesDados.taxaIdentificacao < 80) {
    console.log('\n🏠 MELHORAR IDENTIFICAÇÃO DE PROPRIEDADES:');
    console.log('   1. Adicionar mais aliases');
    console.log('   2. Ajustar algoritmo de matching');
    console.log('   3. Revisar nomes nas atividades sem ID');
  }
  
  if (resultados.hospedes < resultados.sucessos * 0.7) {
    console.log('\n👤 MELHORAR EXTRAÇÃO DE HÓSPEDES:');
    console.log('   1. Ajustar estratégias de extração de nomes');
    console.log('   2. Verificar padrões nos PDFs');
    console.log('   3. Otimizar validação de nomes');
  }
  
  // AVALIAÇÃO GERAL
  console.log('\n🌟 AVALIAÇÃO GERAL:');
  console.log('===================');
  
  let pontuacao = 0;
  let avaliacoes = [];
  
  // Critério 1: Taxa de sucesso PDFs
  if (taxaSucessoPdf >= 80) {
    pontuacao += 30;
    avaliacoes.push('✅ PDFs: Excelente');
  } else if (taxaSucessoPdf >= 60) {
    pontuacao += 20;
    avaliacoes.push('⚠️ PDFs: Bom');
  } else {
    pontuacao += 10;
    avaliacoes.push('❌ PDFs: Precisa melhorar');
  }
  
  // Critério 2: Identificação de propriedades
  const taxaId = resultados.basesDados?.taxaIdentificacao || 0;
  if (taxaId >= 80) {
    pontuacao += 30;
    avaliacoes.push('✅ Propriedades: Excelente');
  } else if (taxaId >= 60) {
    pontuacao += 20;
    avaliacoes.push('⚠️ Propriedades: Bom');
  } else {
    pontuacao += 10;
    avaliacoes.push('❌ Propriedades: Precisa melhorar');
  }
  
  // Critério 3: Extração de hóspedes
  const taxaHospedes = resultados.totalPdfs > 0 ? 
    ((resultados.hospedes / resultados.totalPdfs) * 100) : 0;
  if (taxaHospedes >= 70) {
    pontuacao += 20;
    avaliacoes.push('✅ Hóspedes: Excelente');
  } else if (taxaHospedes >= 50) {
    pontuacao += 15;
    avaliacoes.push('⚠️ Hóspedes: Bom');
  } else {
    pontuacao += 10;
    avaliacoes.push('❌ Hóspedes: Precisa melhorar');
  }
  
  // Critério 4: Base de dados
  if (resultados.basesDados?.atividades >= 25) {
    pontuacao += 20;
    avaliacoes.push('✅ Base de dados: Excelente');
  } else if (resultados.basesDados?.atividades >= 15) {
    pontuacao += 15;
    avaliacoes.push('⚠️ Base de dados: Bom');
  } else {
    pontuacao += 10;
    avaliacoes.push('❌ Base de dados: Precisa melhorar');
  }
  
  console.log(`🎯 PONTUAÇÃO FINAL: ${pontuacao}/100`);
  
  for (const avaliacao of avaliacoes) {
    console.log(`   ${avaliacao}`);
  }
  
  if (pontuacao >= 90) {
    console.log('\n🌟 SISTEMA EXCELENTE - Pronto para produção!');
  } else if (pontuacao >= 75) {
    console.log('\n✅ SISTEMA BOM - Algumas melhorias recomendadas');
  } else if (pontuacao >= 60) {
    console.log('\n⚠️ SISTEMA MÉDIO - Melhorias necessárias');
  } else {
    console.log('\n❌ SISTEMA PRECISA DE CORREÇÕES - Ação urgente necessária');
  }
  
  return resultados;
}

// Executar validação
validacaoRapida()
  .then(resultado => {
    console.log('\n✅ VALIDAÇÃO RÁPIDA CONCLUÍDA!');
  })
  .catch(error => {
    console.error('❌ Erro na validação:', error);
  });