/**
 * PROCESSAMENTO RÁPIDO DE PDFs ESPECÍFICOS
 * Foca nos arquivos mais promissores para maximizar o score rapidamente
 */

import fs from 'fs';

async function processarPdfsRapido() {
  console.log('⚡ PROCESSAMENTO RÁPIDO DE PDFs');
  console.log('==============================');
  
  // PDFs mais promissores baseados na análise
  const pdfsEstrategicos = [
    'control2.pdf', // Provavelmente múltiplas reservas
    'entrada.pdf',  // Documento de entrada
    'file (13).pdf', // Check-in
    'file (14).pdf'  // Check-out
  ];
  
  let scoreInicial = await verificarScore();
  console.log(`📊 Score inicial: ${scoreInicial.score}% (${scoreInicial.comPropriedade}/${scoreInicial.total})`);
  
  for (let i = 0; i < pdfsEstrategicos.length; i++) {
    const arquivo = pdfsEstrategicos[i];
    
    if (!fs.existsSync(arquivo)) {
      console.log(`⚠️ Arquivo não encontrado: ${arquivo}`);
      continue;
    }
    
    console.log(`\n📄 [${i+1}/${pdfsEstrategicos.length}] Processando: ${arquivo}`);
    
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
          console.log(`   🏠 ${result.data.propertyName} (sem ID - pode melhorar com aliases)`);
        }
        
        if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
          console.log(`   👤 ${result.data.guestName}`);
        }
        
      } else {
        console.log(`   ❌ Falha: ${result.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Verificar progresso após cada PDF
    if (i < pdfsEstrategicos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const progresso = await verificarScore();
      console.log(`   📈 Progresso: ${progresso.score}% (+${(progresso.score - scoreInicial.score).toFixed(1)}%)`);
    }
  }
  
  // Score final
  const scoreFinal = await verificarScore();
  const melhoria = (scoreFinal.score - scoreInicial.score).toFixed(1);
  
  console.log('\n🏆 RESULTADO FINAL:');
  console.log(`📊 Score final: ${scoreFinal.score}% (${scoreFinal.comPropriedade}/${scoreFinal.total})`);
  console.log(`📈 Melhoria: +${melhoria}%`);
  console.log(`🎯 Novas atividades: +${scoreFinal.total - scoreInicial.total}`);
  console.log(`✅ Novas identificações: +${scoreFinal.comPropriedade - scoreInicial.comPropriedade}`);
  
  if (parseFloat(melhoria) >= 10) {
    console.log('\n🌟 EXCELENTE! Melhoria significativa alcançada!');
  } else if (parseFloat(melhoria) >= 5) {
    console.log('\n✅ BOM! Progresso sólido!');
  } else if (parseFloat(melhoria) > 0) {
    console.log('\n👍 Algum progresso feito');
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
    return { total: 0, comPropriedade: 0, score: 0 };
  }
}

// Executar processamento rápido
processarPdfsRapido()
  .then(resultado => {
    console.log('\n✅ PROCESSAMENTO RÁPIDO CONCLUÍDO!');
    console.log(`🎯 Score alcançado: ${resultado.score}%`);
    
    if (resultado.score >= 70) {
      console.log('🎉 Sistema funcionando excelentemente!');
    } else if (resultado.score >= 60) {
      console.log('👍 Sistema funcionando bem!');
    } else if (resultado.score >= 50) {
      console.log('⚡ Progresso sólido feito!');
    }
  })
  .catch(error => {
    console.error('❌ Erro no processamento:', error);
  });