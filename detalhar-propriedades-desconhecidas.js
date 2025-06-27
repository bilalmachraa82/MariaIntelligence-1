/**
 * DETALHAR PROPRIEDADES DESCONHECIDAS
 * Investiga os PDFs específicos que geraram "Propriedade desconhecida"
 */

async function detalharPropriedadesDesconhecidas() {
  console.log('🔍 INVESTIGAÇÃO DETALHADA: PROPRIEDADES DESCONHECIDAS');
  console.log('===================================================');
  
  // Obter atividades com "Propriedade desconhecida"
  const response = await fetch('http://localhost:5000/api/activities');
  const data = await response.json();
  const atividades = data.activities;
  
  const propriedadesDesconhecidas = atividades.filter(a => 
    a.description && a.description.includes('Propriedade desconhecida')
  );
  
  console.log(`📊 Total de "Propriedades desconhecidas": ${propriedadesDesconhecidas.length}`);
  
  // Analisar cada atividade detalhadamente
  console.log('\n📋 ANÁLISE DETALHADA DE CADA ATIVIDADE:');
  console.log('=====================================');
  
  for (let i = 0; i < propriedadesDesconhecidas.length; i++) {
    const atividade = propriedadesDesconhecidas[i];
    console.log(`\n${i + 1}. ATIVIDADE ID ${atividade.id}:`);
    console.log(`   📝 Descrição completa: "${atividade.description}"`);
    console.log(`   📅 Data criação: ${atividade.createdAt}`);
    
    // Extrair hóspede da descrição
    const match = atividade.description.match(/PDF processado:\s*(.+?)\s*-\s*Propriedade desconhecida/);
    if (match) {
      const hospede = match[1].trim();
      console.log(`   👤 Hóspede extraído: "${hospede}"`);
      
      // Analisar padrão do hóspede
      if (hospede === 'Hóspede desconhecido') {
        console.log(`   ⚠️ PROBLEMA: PDF não conseguiu extrair nome do hóspede`);
        console.log(`   💡 CAUSA: Possível PDF digitalizado mal ou texto ilegível`);
      } else if (hospede.includes('Todos\nEdif')) {
        console.log(`   ⚠️ PROBLEMA: Nome mal formatado com quebras de linha`);
        console.log(`   💡 POSSÍVEL ORIGEM: "${hospede.replace(/\n/g, ' ')}"`);
      } else if (hospede === 'El Mahdi') {
        console.log(`   ✅ HÓSPEDE VÁLIDO: Nome estrangeiro bem extraído`);
        console.log(`   💡 PROBLEMA: Apenas a propriedade não foi identificada`);
      } else {
        console.log(`   ✅ HÓSPEDE VÁLIDO: "${hospede}"`);
        console.log(`   💡 PROBLEMA: Apenas a propriedade não foi identificada`);
      }
    }
    
    // Tentar identificar padrões temporais
    const atividadesProximas = atividades.filter(a => {
      if (!a.createdAt || !atividade.createdAt) return false;
      const diffMs = Math.abs(new Date(a.createdAt) - new Date(atividade.createdAt));
      const diffMinutos = diffMs / (1000 * 60);
      return diffMinutos <= 30 && a.id !== atividade.id; // Atividades no mesmo período
    });
    
    if (atividadesProximas.length > 0) {
      console.log(`   ⏰ ATIVIDADES PRÓXIMAS NO TEMPO:`);
      atividadesProximas.forEach(proxima => {
        if (proxima.entityId) {
          console.log(`     - ID ${proxima.id}: Propriedade ID ${proxima.entityId}`);
        } else {
          console.log(`     - ID ${proxima.id}: Também órfã`);
        }
      });
    }
  }
  
  // Análise de contexto temporal
  console.log('\n⏰ ANÁLISE TEMPORAL:');
  console.log('===================');
  
  // Agrupar atividades por data de criação
  const atividadesPorData = {};
  atividades.forEach(atividade => {
    if (atividade.createdAt) {
      const data = atividade.createdAt.split('T')[0]; // Apenas a data
      if (!atividadesPorData[data]) {
        atividadesPorData[data] = [];
      }
      atividadesPorData[data].push(atividade);
    }
  });
  
  console.log('📅 Atividades por data:');
  Object.entries(atividadesPorData).forEach(([data, ativs]) => {
    console.log(`\n   ${data}: ${ativs.length} atividades`);
    
    const comPropriedade = ativs.filter(a => a.entityId !== null);
    const semPropriedade = ativs.filter(a => a.entityId === null);
    
    if (comPropriedade.length > 0) {
      console.log(`     ✅ Com propriedade (${comPropriedade.length}):`);
      const propriedadeCount = {};
      comPropriedade.forEach(a => {
        if (!propriedadeCount[a.entityId]) propriedadeCount[a.entityId] = 0;
        propriedadeCount[a.entityId]++;
      });
      
      Object.entries(propriedadeCount).forEach(([propId, count]) => {
        console.log(`       - Propriedade ID ${propId}: ${count} atividades`);
      });
    }
    
    if (semPropriedade.length > 0) {
      console.log(`     ❌ Sem propriedade (${semPropriedade.length}): IDs ${semPropriedade.map(a => a.id).join(', ')}`);
    }
  });
  
  // Recomendações baseadas na análise
  console.log('\n💡 RECOMENDAÇÕES BASEADAS NA ANÁLISE:');
  console.log('====================================');
  
  // Encontrar propriedade mais comum no mesmo período
  const propriedadesMaisComuns = {};
  atividades.filter(a => a.entityId !== null).forEach(a => {
    if (!propriedadesMaisComuns[a.entityId]) propriedadesMaisComuns[a.entityId] = 0;
    propriedadesMaisComuns[a.entityId]++;
  });
  
  const propriedadeMaisComum = Object.entries(propriedadesMaisComuns)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (propriedadeMaisComum) {
    console.log(`1. PROPRIEDADE MAIS ATIVA: ID ${propriedadeMaisComum[0]} (${propriedadeMaisComum[1]} atividades)`);
    console.log(`   💡 Recomendo atribuir as 5 "Propriedades desconhecidas" à propriedade ID ${propriedadeMaisComum[0]}`);
  }
  
  console.log('\n2. ANÁLISE POR HÓSPEDE:');
  propriedadesDesconhecidas.forEach(atividade => {
    const match = atividade.description.match(/PDF processado:\s*(.+?)\s*-\s*Propriedade desconhecida/);
    if (match) {
      const hospede = match[1].trim();
      if (hospede !== 'Hóspede desconhecido') {
        console.log(`   - "${hospede}" (ID ${atividade.id}): Hóspede válido, propriedade falhou na extração`);
      }
    }
  });
  
  return {
    totalDesconhecidas: propriedadesDesconhecidas.length,
    propriedadeMaisComum: propriedadeMaisComum ? propriedadeMaisComum[0] : null,
    detalhes: propriedadesDesconhecidas.map(a => ({
      id: a.id,
      description: a.description,
      createdAt: a.createdAt
    }))
  };
}

// Executar investigação
detalharPropriedadesDesconhecidas()
  .then(resultado => {
    console.log('\n✅ INVESTIGAÇÃO DETALHADA CONCLUÍDA!');
    console.log(`🎯 ${resultado.totalDesconhecidas} propriedades desconhecidas analisadas`);
    if (resultado.propriedadeMaisComum) {
      console.log(`💡 Recomendação: Atribuir todas à propriedade ID ${resultado.propriedadeMaisComum}`);
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });