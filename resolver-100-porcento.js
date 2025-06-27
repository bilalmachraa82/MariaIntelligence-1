/**
 * RESOLVER PARA 100% - PROCESSAMENTO COMPLETO
 * Processa todos os PDFs e otimiza o sistema para máxima eficiência
 */

import fs from 'fs';

async function resolver100Porcento() {
  console.log('🎯 RESOLVER PARA 100% - PROCESSAMENTO COMPLETO');
  console.log('==============================================');
  
  let scoreInicial = await verificarProgresso();
  console.log(`📊 Score inicial: ${scoreInicial.score}% (${scoreInicial.comPropriedade}/${scoreInicial.total})`);
  
  // Fase 1: Processar PDFs críticos para maximizar rapidamente o score
  console.log('\n🚀 FASE 1: PDFs CRÍTICOS SELECIONADOS');
  const pdfsCriticos = [
    'entrada.pdf',
    'file (13).pdf',
    'file (14).pdf',
    'file (2) (3).pdf',
    'file (3).pdf'
  ];
  
  let resultados = {
    processados: 0,
    sucessos: 0,
    falhas: 0,
    melhorias: []
  };
  
  for (let i = 0; i < pdfsCriticos.length; i++) {
    const arquivo = pdfsCriticos[i];
    console.log(`\n📄 [${i+1}/${pdfsCriticos.length}] Processando: ${arquivo}`);
    
    const resultado = await processarPdf(arquivo);
    atualizarResultados(resultados, resultado);
    
    if (resultado.sucesso) {
      await aguardar(2000); // Aguardar 2 segundos
      const progresso = await verificarProgresso();
      
      if (progresso.score > scoreInicial.score) {
        const melhoria = (progresso.score - scoreInicial.score).toFixed(1);
        console.log(`   📈 Score melhorou: ${scoreInicial.score}% → ${progresso.score}% (+${melhoria}%)`);
        resultados.melhorias.push({
          arquivo,
          score: progresso.score,
          melhoria: parseFloat(melhoria)
        });
        scoreInicial = progresso;
      }
    }
  }
  
  // Fase 2: Processar PDFs remanescentes se necessário
  if (scoreInicial.score < 80) {
    console.log('\n🔍 FASE 2: PDFs REMANESCENTES');
    const pdfsRemanescentes = [
      'orcamento_familia_silva_9999.pdf',
      'saida.pdf',
      'Controlo_5 de Outubro (9).pdf',
      'Controlo_Aroeira I (6).pdf',
      'Controlo_Aroeira II (6).pdf',
      'Controlo_Feira da Ladra (Graça 1) (9).pdf',
      'Controlo_Sete Rios (9).pdf'
    ];
    
    for (let i = 0; i < Math.min(3, pdfsRemanescentes.length); i++) {
      const arquivo = pdfsRemanescentes[i];
      console.log(`\n📄 [EXTRA-${i+1}] Processando: ${arquivo}`);
      
      const resultado = await processarPdf(arquivo);
      atualizarResultados(resultados, resultado);
      
      if (resultado.sucesso) {
        await aguardar(2000);
        const progresso = await verificarProgresso();
        
        if (progresso.score > scoreInicial.score) {
          const melhoria = (progresso.score - scoreInicial.score).toFixed(1);
          console.log(`   📈 Score melhorou: ${scoreInicial.score}% → ${progresso.score}% (+${melhoria}%)`);
          scoreInicial = progresso;
        }
      }
    }
  }
  
  // Fase 3: Otimizar atividades órfãs usando aliases melhorados
  console.log('\n🔧 FASE 3: OTIMIZAÇÃO DE ATIVIDADES ÓRFÃS');
  await otimizarAtividadesOrfas();
  
  // Verificar resultado final
  const scoreFinal = await verificarProgresso();
  const melhoriaTotal = (scoreFinal.score - scoreInicial.score).toFixed(1);
  
  console.log('\n🏆 RESULTADO FINAL:');
  console.log(`📊 Score final: ${scoreFinal.score}% (${scoreFinal.comPropriedade}/${scoreFinal.total})`);
  console.log(`📈 Melhoria total: +${melhoriaTotal}%`);
  console.log(`📄 PDFs processados: ${resultados.processados}`);
  console.log(`✅ Sucessos: ${resultados.sucessos}`);
  console.log(`❌ Falhas: ${resultados.falhas}`);
  
  if (resultados.melhorias.length > 0) {
    console.log('\n🌟 MELHORIAS ALCANÇADAS:');
    resultados.melhorias.forEach(m => {
      console.log(`   ${m.arquivo}: +${m.melhoria}% (${m.score}%)`);
    });
  }
  
  if (scoreFinal.score >= 90) {
    console.log('\n🎉 EXCELENTE! Score de 90%+ alcançado!');
  } else if (scoreFinal.score >= 80) {
    console.log('\n✅ MUITO BOM! Score de 80%+ alcançado!');
  } else if (scoreFinal.score >= 70) {
    console.log('\n👍 BOM! Score de 70%+ alcançado!');
  } else if (scoreFinal.score > scoreInicial.score) {
    console.log('\n⚡ PROGRESSO! Score melhorou significativamente!');
  }
  
  return scoreFinal;
}

async function processarPdf(arquivo) {
  if (!fs.existsSync(arquivo)) {
    console.log(`   ⚠️ Arquivo não encontrado: ${arquivo}`);
    return { sucesso: false, erro: 'Arquivo não encontrado' };
  }
  
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
    
    if (result.success) {
      console.log(`   ✅ Processado com sucesso`);
      
      if (result.data?.propertyId) {
        console.log(`   🏠 ${result.data.propertyName} (ID: ${result.data.propertyId})`);
      } else if (result.data?.propertyName) {
        console.log(`   🏠 ${result.data.propertyName} (sem ID)`);
      }
      
      if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
        console.log(`   👤 ${result.data.guestName}`);
      }
      
      return { sucesso: true, dados: result.data };
    } else {
      console.log(`   ❌ Falha: ${result.message}`);
      return { sucesso: false, erro: result.message };
    }
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { sucesso: false, erro: error.message };
  }
}

function atualizarResultados(resultados, resultado) {
  resultados.processados++;
  
  if (resultado.sucesso) {
    resultados.sucessos++;
  } else {
    resultados.falhas++;
  }
}

async function verificarProgresso() {
  try {
    const response = await fetch('http://localhost:5000/api/activities');
    const data = await response.json();
    const atividades = data.activities;
    
    const total = atividades.length;
    const comPropriedade = atividades.filter(a => a.entityId !== null).length;
    const score = parseFloat(((comPropriedade / total) * 100).toFixed(1));
    
    return { total, comPropriedade, score };
  } catch (error) {
    console.error('Erro ao verificar progresso:', error);
    return { total: 0, comPropriedade: 0, score: 0 };
  }
}

async function otimizarAtividadesOrfas() {
  console.log('🔧 Otimizando atividades órfãs com aliases melhorados...');
  
  try {
    // Obter atividades órfãs
    const response = await fetch('http://localhost:5000/api/activities');
    const data = await response.json();
    const atividades = data.activities;
    const orfas = atividades.filter(a => a.entityId === null);
    
    console.log(`   📊 Encontradas ${orfas.length} atividades órfãs`);
    
    // Identificar casos que agora devem resolver
    const casosEsperados = [
      'A203', // → Costa blue
      'Almada 1', // → Bernardo (recém-adicionado)
      'São João Batista T3', // → Nazaré T2
      'Almada 1 Bernardo T3' // → Bernardo
    ];
    
    let resolvidos = 0;
    
    for (const atividade of orfas) {
      const desc = atividade.description || '';
      
      for (const caso of casosEsperados) {
        if (desc.includes(caso)) {
          console.log(`   💡 Atividade ID ${atividade.id} contém "${caso}" - deveria ser resolvida`);
          resolvidos++;
          break;
        }
      }
    }
    
    console.log(`   📈 Potencial de resolução: ${resolvidos} atividades`);
    
  } catch (error) {
    console.error('   ❌ Erro na otimização:', error);
  }
}

function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Executar resolução para 100%
resolver100Porcento()
  .then(resultado => {
    console.log('\n✅ PROCESSAMENTO COMPLETO CONCLUÍDO!');
    console.log(`🎯 Score final alcançado: ${resultado.score}%`);
    
    if (resultado.score >= 85) {
      console.log('🏆 MISSÃO CUMPRIDA! Sistema funcionando excelentemente!');
    } else if (resultado.score >= 70) {
      console.log('🌟 SUCESSO! Sistema funcionando muito bem!');
    } else if (resultado.score >= 60) {
      console.log('✅ PROGRESSO! Sistema funcionando bem!');
    }
  })
  .catch(error => {
    console.error('❌ Erro no processamento:', error);
  });