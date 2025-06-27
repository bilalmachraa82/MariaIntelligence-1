/**
 * PROCESSAMENTO DOS PDFs CRÍTICOS
 * Processa os arquivos mais importantes para melhorar o score rapidamente
 */

import fs from 'fs';

async function processarPdfsCriticos() {
  console.log('🚀 PROCESSAMENTO DE PDFs CRÍTICOS');
  console.log('=================================');
  
  // PDFs mais importantes para processar
  const pdfsCriticos = [
    'control1.pdf',
    'control2.pdf', 
    'entrada.pdf',
    'file (13).pdf',
    'file (14).pdf'
  ];
  
  let sucessos = 0;
  let falhas = 0;
  let novasAtividades = 0;
  
  console.log(`📄 Processando ${pdfsCriticos.length} PDFs críticos...\n`);
  
  for (let i = 0; i < pdfsCriticos.length; i++) {
    const arquivo = pdfsCriticos[i];
    
    if (!fs.existsSync(arquivo)) {
      console.log(`⚠️ [${i+1}/${pdfsCriticos.length}] Arquivo não encontrado: ${arquivo}`);
      continue;
    }
    
    console.log(`📄 [${i+1}/${pdfsCriticos.length}] Processando: ${arquivo}`);
    
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
        sucessos++;
        console.log(`   ✅ Processado com sucesso`);
        
        if (result.data?.propertyId) {
          novasAtividades++;
          console.log(`   🏠 Propriedade: ${result.data.propertyName} (ID: ${result.data.propertyId})`);
        }
        
        if (result.data?.guestName && result.data.guestName !== 'Hóspede desconhecido') {
          console.log(`   👤 Hóspede: ${result.data.guestName}`);
        }
        
        if (result.data?.checkInDate) {
          console.log(`   📅 Check-in: ${result.data.checkInDate}`);
        }
        
      } else {
        falhas++;
        console.log(`   ❌ Falha: ${result.message}`);
      }
      
    } catch (error) {
      falhas++;
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Pausa entre processamentos
    if (i < pdfsCriticos.length - 1) {
      console.log('   ⏳ Aguardando 3 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Verificar score atualizado
  console.log('\n📊 VERIFICANDO SCORE ATUALIZADO:');
  console.log('================================');
  
  try {
    const response = await fetch('http://localhost:5000/api/activities');
    const data = await response.json();
    const atividades = data.activities;
    
    const comPropriedade = atividades.filter(a => a.entityId !== null).length;
    const total = atividades.length;
    const novoScore = ((comPropriedade / total) * 100).toFixed(1);
    
    console.log(`📝 Total de atividades: ${total}`);
    console.log(`✅ Com propriedade identificada: ${comPropriedade}`);
    console.log(`📊 Score atualizado: ${novoScore}%`);
    
    // Calcular melhoria
    const scorePrevio = 45.2; // Score anterior
    const melhoria = (parseFloat(novoScore) - scorePrevio).toFixed(1);
    
    if (melhoria > 0) {
      console.log(`📈 Melhoria: +${melhoria}% (${comPropriedade - 14} novas atividades identificadas)`);
    }
    
  } catch (error) {
    console.log(`❌ Erro ao verificar score: ${error.message}`);
  }
  
  // Relatório final
  console.log('\n🎯 RELATÓRIO DE PROCESSAMENTO:');
  console.log('==============================');
  
  console.log(`📄 PDFs processados: ${sucessos + falhas}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`🏠 Novas atividades com propriedade: ${novasAtividades}`);
  
  const taxaSucesso = pdfsCriticos.length > 0 ? 
    ((sucessos / pdfsCriticos.length) * 100).toFixed(1) : 0;
  console.log(`📊 Taxa de sucesso: ${taxaSucesso}%`);
  
  if (sucessos >= 3) {
    console.log('\n🌟 EXCELENTE! Processamento muito bem-sucedido');
  } else if (sucessos >= 2) {
    console.log('\n✅ BOM! Alguns PDFs processados com sucesso');
  } else if (sucessos >= 1) {
    console.log('\n⚠️ MÉDIO! Poucos PDFs processados');
  } else {
    console.log('\n❌ CRÍTICO! Nenhum PDF processado com sucesso');
  }
  
  return {
    sucessos,
    falhas,
    novasAtividades,
    taxaSucesso: parseFloat(taxaSucesso)
  };
}

// Executar processamento
console.log('🚀 Iniciando processamento de PDFs críticos...\n');

processarPdfsCriticos()
  .then(resultado => {
    console.log('\n✅ PROCESSAMENTO DE PDFs CRÍTICOS CONCLUÍDO!');
    console.log(`🎯 Resultado: ${resultado.sucessos}/${resultado.sucessos + resultado.falhas} PDFs processados`);
    
    if (resultado.novasAtividades > 0) {
      console.log(`🏆 Score melhorado com ${resultado.novasAtividades} novas identificações!`);
    }
  })
  .catch(error => {
    console.error('❌ Erro no processamento:', error);
  });