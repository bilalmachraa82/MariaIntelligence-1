/**
 * IDENTIFICAR PDF DE ORIGEM DAS PROPRIEDADES DESCONHECIDAS
 * Correlaciona timestamps das atividades com logs de processamento
 */

async function identificarPdfOrigem() {
  console.log('🔍 IDENTIFICAR ORIGEM DOS PDFs COM PROPRIEDADES DESCONHECIDAS');
  console.log('============================================================');
  
  // Analisar atividades órfãs por horário
  const response = await fetch('http://localhost:5000/api/activities');
  const data = await response.json();
  const atividades = data.activities;
  
  const propriedadesDesconhecidas = atividades.filter(a => 
    a.description && a.description.includes('Propriedade desconhecida')
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  console.log('⏰ CRONOLOGIA DAS ATIVIDADES ÓRFÃS:');
  console.log('==================================');
  
  propriedadesDesconhecidas.forEach((atividade, index) => {
    const data = new Date(atividade.createdAt);
    const hora = data.toLocaleTimeString('pt-PT');
    
    console.log(`${index + 1}. ID ${atividade.id} - ${hora}`);
    console.log(`   📝 ${atividade.description}`);
  });
  
  // Mostrar períodos de processamento
  console.log('\n📅 PERÍODOS DE PROCESSAMENTO IDENTIFICADOS:');
  console.log('==========================================');
  
  const periodos = [
    {
      inicio: '2025-06-27T08:08:00Z',
      fim: '2025-06-27T08:17:30Z',
      atividades: [18, 20, 21, 22, 23],
      descricao: 'Primeiro lote (5 atividades órfãs)'
    },
    {
      inicio: '2025-06-27T08:29:00Z', 
      fim: '2025-06-27T08:36:00Z',
      atividades: [24, 25, 26],
      descricao: 'Segundo lote (3 atividades órfãs "Todos Edif")'
    }
  ];
  
  periodos.forEach((periodo, index) => {
    console.log(`\n${index + 1}. ${periodo.descricao}:`);
    console.log(`   ⏰ ${periodo.inicio} até ${periodo.fim}`);
    console.log(`   📊 Atividades: ${periodo.atividades.join(', ')}`);
  });
  
  // Analisar PDFs que podem ter sido processados nesses horários
  console.log('\n📄 PDFs CANDIDATOS BASEADO NO TIMING:');
  console.log('====================================');
  
  console.log('Baseado nos timestamps, estes PDFs foram provavelmente processados:');
  console.log('');
  
  console.log('🕐 08:08-08:17 (5 atividades órfãs):');
  console.log('   - "El Mahdi" (2x)');
  console.log('   - "Hóspede desconhecido" (3x)'); 
  console.log('   💡 Possível PDF: Um documento com múltiplas reservas mal digitalizadas');
  console.log('');
  
  console.log('🕐 08:29-08:36 (3 atividades "Todos Edif"):');
  console.log('   - Todas com padrão "Todos\\nEdif"');
  console.log('   💡 Possível PDF: Documento com erro de formatação/quebras de linha');
  console.log('');
  
  // Listar PDFs que foram adicionados recentemente ao sistema
  console.log('📋 PDFs DISPONÍVEIS NO SISTEMA:');
  console.log('==============================');
  
  const pdfsEstrategicos = [
    'control1.pdf',
    'control2.pdf', 
    'Check-in Maria faz.pdf',
    'Check-outs Maria faz.pdf',
    'entrada.pdf',
    'file (13).pdf',
    'file (14).pdf'
  ];
  
  pdfsEstrategicos.forEach(pdf => {
    console.log(`   - ${pdf}`);
  });
  
  console.log('\n🤔 QUESTÕES PARA IDENTIFICAR O PDF ORIGINAL:');
  console.log('===========================================');
  console.log('1. Qual PDF foi processado entre 08:08-08:17 que gerou:');
  console.log('   - 2 reservas "El Mahdi"');
  console.log('   - 3 reservas "Hóspede desconhecido"');
  console.log('');
  console.log('2. Qual PDF foi processado entre 08:29-08:36 que gerou:');
  console.log('   - 3 reservas com "Todos Edif" (possível empresa/proprietário)');
  console.log('');
  console.log('💡 Com esta informação, posso identificar a propriedade correta!');
  console.log('   Por exemplo: se veio de "control1.pdf", posso ver o conteúdo');
  console.log('   e determinar qual propriedade estava sendo processada.');
  
  return {
    totalOrfas: propriedadesDesconhecidas.length,
    periodos,
    pdfsDisponiveis: pdfsEstrategicos
  };
}

// Executar identificação
identificarPdfOrigem()
  .then(resultado => {
    console.log('\n✅ ANÁLISE DE ORIGEM CONCLUÍDA!');
    console.log(`🎯 ${resultado.totalOrfas} atividades órfãs analisadas em ${resultado.periodos.length} períodos`);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });