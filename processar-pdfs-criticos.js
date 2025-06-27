/**
 * PROCESSAMENTO DOS PDFs CRÍTICOS
 * Processa os arquivos mais importantes para melhorar o score rapidamente
 */

import fs from 'fs';

async function processarPdfsCriticos() {
  console.log('📄 PROCESSAMENTO RÁPIDO DE PDFs CRÍTICOS');
  console.log('=======================================');
  
  const scoreInicial = await verificarScore();
  console.log(`📊 Score inicial: ${scoreInicial.score}% (${scoreInicial.comPropriedade}/${scoreInicial.total})`);
  
  // PDFs estratégicos que provavelmente contêm múltiplas reservas
  const pdfsCriticos = [
    'Check-in Maria faz.pdf',  // Check-ins múltiplos
    'Check-outs Maria faz.pdf', // Check-outs múltiplos
    'file (13).pdf',           // Controle 1
    'file (14).pdf',           // Controle 2
    'file (3).pdf'             // Arquivo adicional
  ];
  
  let sucessos = 0;
  let melhorias = [];
  
  for (let i = 0; i < pdfsCriticos.length; i++) {
    const arquivo = pdfsCriticos[i];
    console.log(`\n📄 [${i+1}/${pdfsCriticos.length}] Processando: ${arquivo}`);
    
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
        }
        
        if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
          console.log(`   👤 ${result.data.guestName}`);
        }
        
        // Verificar melhoria no score
        await new Promise(resolve => setTimeout(resolve, 2000));
        const novoScore = await verificarScore();
        
        if (novoScore.score > scoreInicial.score) {
          const melhoria = (novoScore.score - scoreInicial.score).toFixed(1);
          console.log(`   📈 Score melhorou: +${melhoria}% (agora ${novoScore.score}%)`);
          melhorias.push({ arquivo, melhoria: parseFloat(melhoria) });
        }
        
      } else {
        console.log(`   ❌ Falha: ${result.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  const scoreFinal = await verificarScore();
  const melhoriaTotal = (scoreFinal.score - scoreInicial.score).toFixed(1);
  
  console.log('\n🏆 RESULTADO FINAL:');
  console.log(`📊 Score final: ${scoreFinal.score}% (${scoreFinal.comPropriedade}/${scoreFinal.total})`);
  console.log(`📈 Melhoria total: +${melhoriaTotal}%`);
  console.log(`✅ PDFs processados com sucesso: ${sucessos}/${pdfsCriticos.length}`);
  
  if (melhorias.length > 0) {
    console.log('\n🌟 MELHORIAS POR ARQUIVO:');
    melhorias.forEach(m => {
      console.log(`   ${m.arquivo}: +${m.melhoria}%`);
    });
  }
  
  if (scoreFinal.score >= 85) {
    console.log('\n🎉 EXCELENTE! Score de 85%+ alcançado!');
  } else if (scoreFinal.score >= 80) {
    console.log('\n✅ MUITO BOM! Score de 80%+ alcançado!');
  } else if (scoreFinal.score >= 75) {
    console.log('\n👍 BOM! Score de 75%+ alcançado!');
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

// Executar processamento
processarPdfsCriticos()
  .then(resultado => {
    console.log('\n✅ PROCESSAMENTO DE PDFs CRÍTICOS CONCLUÍDO!');
    console.log(`🎯 Score final: ${resultado.score}%`);
    
    if (resultado.score >= 80) {
      console.log('🏆 OBJETIVO ALCANÇADO! Sistema funcionando excelentemente!');
    } else if (resultado.score >= 75) {
      console.log('🌟 MUITO PRÓXIMO! Excelente progresso!');
    }
  })
  .catch(error => {
    console.error('❌ Erro no processamento:', error);
  });