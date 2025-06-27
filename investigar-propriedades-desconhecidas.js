/**
 * INVESTIGAR PROPRIEDADES DESCONHECIDAS
 * Analisa e tenta resolver as atividades com "Propriedade desconhecida"
 */

async function investigarPropriedadesDesconhecidas() {
  console.log('🔍 INVESTIGAÇÃO: PROPRIEDADES DESCONHECIDAS');
  console.log('==========================================');
  
  // Obter atividades órfãs
  const response = await fetch('http://localhost:5000/api/activities');
  const data = await response.json();
  const atividades = data.activities;
  const orfas = atividades.filter(a => a.entityId === null);
  
  console.log(`📊 Total de órfãs: ${orfas.length}`);
  
  // Filtrar apenas "Propriedade desconhecida"
  const propriedadesDesconhecidas = orfas.filter(a => 
    a.description && a.description.includes('Propriedade desconhecida')
  );
  
  console.log(`🔍 Propriedades desconhecidas: ${propriedadesDesconhecidas.length}`);
  
  // Analisar padrões detalhadamente
  console.log('\n📋 ANÁLISE DETALHADA:');
  const hospedesEncontrados = new Set();
  
  propriedadesDesconhecidas.forEach((atividade, index) => {
    console.log(`\n${index + 1}. ID ${atividade.id}: "${atividade.description}"`);
    
    // Extrair hóspede
    const match = atividade.description.match(/PDF processado:\s*(.+?)\s*-\s*Propriedade desconhecida/);
    if (match) {
      const hospede = match[1].trim();
      console.log(`   👤 Hóspede: "${hospede}"`);
      hospedesEncontrados.add(hospede);
      
      // Análise do padrão do hóspede
      if (hospede === 'Hóspede desconhecido') {
        console.log(`   ⚠️ Problema: Extração de hóspede falhou`);
      } else if (hospede.includes('Todos\nEdif')) {
        console.log(`   💡 Padrão: Possível nome mal formatado com quebras`);
      } else if (hospede.includes('El Mahdi')) {
        console.log(`   💡 Padrão: Nome estrangeiro válido`);
      }
    }
  });
  
  console.log('\n👥 HÓSPEDES ÚNICOS ENCONTRADOS:');
  Array.from(hospedesEncontrados).forEach(hospede => {
    console.log(`   - "${hospede}"`);
  });
  
  // Tentar estratégias de resolução
  console.log('\n🔧 ESTRATÉGIAS DE RESOLUÇÃO:');
  
  // Estratégia 1: Análise de contexto temporal
  console.log('\n1. ANÁLISE TEMPORAL:');
  const atividadesComPropriedade = atividades.filter(a => a.entityId !== null);
  
  if (atividadesComPropriedade.length > 0) {
    // Obter propriedades mais comuns
    const propriedadeCount = {};
    atividadesComPropriedade.forEach(a => {
      if (!propriedadeCount[a.entityId]) propriedadeCount[a.entityId] = 0;
      propriedadeCount[a.entityId]++;
    });
    
    const propriedadeMaisComum = Object.entries(propriedadeCount)
      .sort((a, b) => b[1] - a[1])[0];
    
    console.log(`   📈 Propriedade mais ativa: ID ${propriedadeMaisComum[0]} (${propriedadeMaisComum[1]} atividades)`);
    
    // Buscar nome da propriedade
    const propResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propResponse.json();
    const propriedade = properties.find(p => p.id == propriedadeMaisComum[0]);
    
    if (propriedade) {
      console.log(`   🏠 Nome: ${propriedade.name}`);
      console.log(`   💡 Sugestão: Algumas "Propriedades desconhecidas" podem ser desta propriedade`);
    }
  }
  
  // Estratégia 2: Análise de "Todos Edif"
  console.log('\n2. ANÁLISE DE "Todos Edif":');
  const todosEdifAtividades = propriedadesDesconhecidas.filter(a => 
    a.description.includes('Todos\nEdif')
  );
  
  if (todosEdifAtividades.length > 0) {
    console.log(`   📊 Atividades com "Todos Edif": ${todosEdifAtividades.length}`);
    console.log(`   💡 Hipótese: "Todos Edif" pode ser um erro de extração`);
    console.log(`   🔧 Sugestão: Pode ser nome de proprietário ou empresa, não propriedade`);
  }
  
  // Estratégia 3: Proposta de correção automática
  console.log('\n3. CORREÇÃO AUTOMÁTICA PROPOSTA:');
  
  let correcoesPossiveis = 0;
  
  // Para "El Mahdi" - verificar se há propriedades similares
  const elMahdiAtividades = propriedadesDesconhecidas.filter(a => 
    a.description.includes('El Mahdi')
  );
  
  if (elMahdiAtividades.length > 0) {
    console.log(`   👤 "El Mahdi": ${elMahdiAtividades.length} atividades`);
    console.log(`   💡 Pode ser atribuído à propriedade mais ativa temporalmente`);
    correcoesPossiveis += elMahdiAtividades.length;
  }
  
  // Para "Hóspede desconhecido" - pode ser erro de extração
  const hospedeDesconhecidoAtividades = propriedadesDesconhecidas.filter(a => 
    a.description.includes('Hóspede desconhecido')
  );
  
  if (hospedeDesconhecidoAtividades.length > 0) {
    console.log(`   ❓ "Hóspede desconhecido": ${hospedeDesconhecidoAtividades.length} atividades`);
    console.log(`   🔧 Necessita reprocessamento do PDF original`);
  }
  
  // Calcular impacto potencial
  const scoreAtual = ((atividades.filter(a => a.entityId !== null).length / atividades.length) * 100).toFixed(1);
  const scorePotencial = (((atividades.filter(a => a.entityId !== null).length + correcoesPossiveis) / atividades.length) * 100).toFixed(1);
  
  console.log('\n📈 IMPACTO POTENCIAL:');
  console.log(`   📊 Score atual: ${scoreAtual}%`);
  console.log(`   🎯 Score com correções: ${scorePotencial}%`);
  console.log(`   📈 Melhoria potencial: +${(scorePotencial - scoreAtual).toFixed(1)}%`);
  
  // Recomendações finais
  console.log('\n💡 RECOMENDAÇÕES:');
  console.log('   1. Atribuir "El Mahdi" à propriedade mais ativa');
  console.log('   2. Investigar PDFs originais de "Hóspede desconhecido"');
  console.log('   3. Verificar se "Todos Edif" é nome válido');
  console.log('   4. Processar mais PDFs para diluir órfãs');
  
  return {
    totalOrfas: orfas.length,
    propriedadesDesconhecidas: propriedadesDesconhecidas.length,
    correcoesPossiveis,
    scoreAtual: parseFloat(scoreAtual),
    scorePotencial: parseFloat(scorePotencial)
  };
}

// Executar investigação
investigarPropriedadesDesconhecidas()
  .then(resultado => {
    console.log('\n✅ INVESTIGAÇÃO CONCLUÍDA!');
    console.log(`🔍 ${resultado.propriedadesDesconhecidas} propriedades desconhecidas analisadas`);
    
    if (resultado.correcoesPossiveis > 0) {
      console.log(`🎯 ${resultado.correcoesPossiveis} correções possíveis identificadas`);
    }
  })
  .catch(error => {
    console.error('❌ Erro na investigação:', error);
  });