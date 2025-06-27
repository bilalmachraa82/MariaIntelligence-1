/**
 * PUSH FINAL PARA 85% - PROCESSAMENTO ESTRATÉGICO
 * Processa PDFs selecionados para alcançar 80-85% rapidamente
 */

import fs from 'fs';

async function pushPara85Porcento() {
  console.log('🚀 PUSH FINAL PARA 85%');
  console.log('=====================');
  
  const scoreInicial = await verificarScore();
  console.log(`📊 Score inicial: ${scoreInicial.score}% (${scoreInicial.comPropriedade}/${scoreInicial.total})`);
  
  // PDFs estratégicos selecionados
  const pdfsEstrategicos = [
    'file (13).pdf',           // Check-in consolidado
    'file (14).pdf',           // Check-out consolidado
    'entrada.pdf',             // Documento de entrada
    'saida.pdf'                // Documento de saída
  ];
  
  let novasAtividades = 0;
  let sucessos = 0;
  
  for (let i = 0; i < pdfsEstrategicos.length; i++) {
    const arquivo = pdfsEstrategicos[i];
    console.log(`\n📄 [${i+1}/${pdfsEstrategicos.length}] Processando: ${arquivo}`);
    
    if (!fs.existsSync(arquivo)) {
      console.log(`   ⚠️ Arquivo não encontrado`);
      continue;
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
        sucessos++;
        
        if (result.data?.propertyId) {
          console.log(`   🏠 ${result.data.propertyName} (ID: ${result.data.propertyId})`);
          novasAtividades++;
        } else if (result.data?.propertyName) {
          console.log(`   🏠 ${result.data.propertyName} (sem ID)`);
        }
        
        if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
          console.log(`   👤 ${result.data.guestName}`);
        }
        
      } else {
        console.log(`   ❌ Falha: ${result.message || 'Erro desconhecido'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Aguardar 2 segundos entre processamentos
    if (i < pdfsEstrategicos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Aguardar e verificar score final
  await new Promise(resolve => setTimeout(resolve, 3000));
  const scoreFinal = await verificarScore();
  const melhoria = (scoreFinal.score - scoreInicial.score).toFixed(1);
  
  console.log('\n🏆 RESULTADO FINAL:');
  console.log(`📊 Score final: ${scoreFinal.score}% (${scoreFinal.comPropriedade}/${scoreFinal.total})`);
  console.log(`📈 Melhoria: +${melhoria}%`);
  console.log(`✅ PDFs processados: ${sucessos}/${pdfsEstrategicos.length}`);
  console.log(`🎯 Novas atividades estimadas: ${novasAtividades}`);
  
  // Análise das atividades órfãs restantes
  console.log('\n📋 ANÁLISE DAS ÓRFÃS RESTANTES:');
  await analisarOrfasRestantes();
  
  if (scoreFinal.score >= 85) {
    console.log('\n🎉 OBJETIVO ALCANÇADO! Score de 85%+ conquistado!');
  } else if (scoreFinal.score >= 80) {
    console.log('\n✅ MUITO PRÓXIMO! Score de 80%+ alcançado!');
  } else if (scoreFinal.score >= 75) {
    console.log('\n👍 PROGRESSO SÓLIDO! Score de 75%+ alcançado!');
  }
  
  return scoreFinal;
}

async function verificarScore() {
  try {
    const response = await fetch('http://localhost:5000/api/activities');
    const data = await response.json();
    const atividades = data.activities;
    
    const total = atividades.length;
    const comPropriedade = atividades.filter(a => a.entityId !== null).length;
    const score = parseFloat(((comPropriedade / total) * 100).toFixed(1));
    
    return { total, comPropriedade, score };
  } catch (error) {
    console.error('Erro ao verificar score:', error);
    return { total: 0, comPropriedade: 0, score: 0 };
  }
}

async function analisarOrfasRestantes() {
  try {
    const response = await fetch('http://localhost:5000/api/activities');
    const data = await response.json();
    const atividades = data.activities;
    const orfas = atividades.filter(a => a.entityId === null);
    
    console.log(`   📊 Órfãs restantes: ${orfas.length}`);
    
    const padroes = {};
    orfas.forEach(atividade => {
      const desc = atividade.description || '';
      const match = desc.match(/(.+?)\s*-\s*(.+)/);
      if (match) {
        const propriedade = match[2].trim();
        if (!padroes[propriedade]) padroes[propriedade] = 0;
        padroes[propriedade]++;
      }
    });
    
    console.log('   📋 Padrões das órfãs:');
    for (const [propriedade, count] of Object.entries(padroes)) {
      console.log(`     - "${propriedade}": ${count} atividades`);
    }
    
    // Calcular quantas ainda precisamos para 85%
    const totalAtual = atividades.length;
    const necessariosPara85 = Math.ceil(totalAtual * 0.85);
    const comPropriedadeAtual = atividades.filter(a => a.entityId !== null).length;
    const faltamPara85 = necessariosPara85 - comPropriedadeAtual;
    
    if (faltamPara85 > 0) {
      console.log(`   🎯 Para 85%: faltam ${faltamPara85} atividades`);
      console.log(`   💡 Sugestão: processar mais PDFs ou investigar "Propriedade desconhecida"`);
    }
    
  } catch (error) {
    console.error('   ❌ Erro na análise:', error);
  }
}

// Executar push para 85%
pushPara85Porcento()
  .then(resultado => {
    console.log('\n✅ PUSH PARA 85% CONCLUÍDO!');
    console.log(`🎯 Score alcançado: ${resultado.score}%`);
    
    if (resultado.score >= 85) {
      console.log('🏆 MISSÃO CUMPRIDA! Sistema otimizado para produção!');
    } else if (resultado.score >= 80) {
      console.log('🌟 EXCELENTE! Sistema funcionando muito bem!');
    }
  })
  .catch(error => {
    console.error('❌ Erro no push:', error);
  });