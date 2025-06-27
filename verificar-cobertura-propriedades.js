/**
 * VERIFICAR COBERTURA DE PROPRIEDADES
 * Analisa se conseguimos reconhecer todas as propriedades nos PDFs
 */

async function verificarCoberturaPropriedades() {
  console.log('🏠 VERIFICAÇÃO: COBERTURA DE PROPRIEDADES');
  console.log('========================================');
  
  // Obter todas as propriedades do sistema
  const propertiesResponse = await fetch('http://localhost:5000/api/properties');
  const properties = await propertiesResponse.json();
  
  console.log(`📊 Total de propriedades no sistema: ${properties.length}`);
  
  // Obter atividades e contar quantas propriedades estão ativas
  const activitiesResponse = await fetch('http://localhost:5000/api/activities');
  const data = await activitiesResponse.json();
  const atividades = data.activities;
  
  const propriedadesAtivas = new Set();
  atividades.forEach(atividade => {
    if (atividade.entityId) {
      propriedadesAtivas.add(atividade.entityId);
    }
  });
  
  console.log(`📈 Propriedades com atividades: ${propriedadesAtivas.size}/${properties.length}`);
  
  // Listar propriedades ativas
  console.log('\n🏠 PROPRIEDADES ATIVAS:');
  const propriedadesAtivasDetalhes = properties
    .filter(p => propriedadesAtivas.has(p.id))
    .sort((a, b) => {
      const countA = atividades.filter(act => act.entityId === a.id).length;
      const countB = atividades.filter(act => act.entityId === b.id).length;
      return countB - countA;
    });
  
  propriedadesAtivasDetalhes.forEach(prop => {
    const count = atividades.filter(act => act.entityId === prop.id).length;
    console.log(`   ${prop.name}: ${count} atividades`);
    if (prop.aliases && prop.aliases.length > 0) {
      console.log(`     Aliases: ${prop.aliases.join(', ')}`);
    }
  });
  
  // Listar propriedades sem atividades
  console.log('\n💤 PROPRIEDADES SEM ATIVIDADES:');
  const propriedadesInativas = properties.filter(p => !propriedadesAtivas.has(p.id));
  
  propriedadesInativas.forEach(prop => {
    console.log(`   ${prop.name}`);
    if (prop.aliases && prop.aliases.length > 0) {
      console.log(`     Aliases: ${prop.aliases.join(', ')}`);
    }
  });
  
  // Analisar problemas restantes
  console.log('\n🔍 ANÁLISE DAS ATIVIDADES ÓRFÃS:');
  const orfas = atividades.filter(a => a.entityId === null);
  
  const problemasPropriedades = {};
  orfas.forEach(atividade => {
    const desc = atividade.description || '';
    const match = desc.match(/(.+?)\s*-\s*(.+)/);
    if (match) {
      const propriedadeExtraida = match[2].trim().replace(/\s+/g, ' ');
      if (!problemasPropriedades[propriedadeExtraida]) {
        problemasPropriedades[propriedadeExtraida] = [];
      }
      problemasPropriedades[propriedadeExtraida].push(atividade.id);
    }
  });
  
  console.log(`📊 Padrões de propriedades não reconhecidas:`);
  for (const [propriedade, ids] of Object.entries(problemasPropriedades)) {
    console.log(`   "${propriedade}": ${ids.length} atividades (IDs: ${ids.join(', ')})`);
    
    // Tentar encontrar matches possíveis
    const matches = encontrarMatchesPossiveis(propriedade, properties);
    if (matches.length > 0) {
      console.log(`     💡 Possíveis matches:`);
      matches.forEach(match => {
        console.log(`       - ${match.name} (${match.score}%)`);
      });
    } else {
      console.log(`     ❌ Nenhum match encontrado`);
    }
  }
  
  // Estatísticas finais
  const cobertura = (propriedadesAtivas.size / properties.length * 100).toFixed(1);
  const scoreAtividades = (atividades.filter(a => a.entityId !== null).length / atividades.length * 100).toFixed(1);
  
  console.log('\n📊 ESTATÍSTICAS:');
  console.log(`   🏠 Cobertura de propriedades: ${cobertura}% (${propriedadesAtivas.size}/${properties.length})`);
  console.log(`   📈 Score de atividades: ${scoreAtividades}% (${atividades.filter(a => a.entityId !== null).length}/${atividades.length})`);
  console.log(`   ❌ Atividades órfãs: ${orfas.length}`);
  
  if (cobertura >= 80) {
    console.log('\n✅ EXCELENTE cobertura de propriedades!');
  } else if (cobertura >= 60) {
    console.log('\n👍 BOA cobertura de propriedades');
  } else {
    console.log('\n⚠️ Cobertura de propriedades pode melhorar');
  }
  
  return {
    totalPropriedades: properties.length,
    propriedadesAtivas: propriedadesAtivas.size,
    cobertura: parseFloat(cobertura),
    scoreAtividades: parseFloat(scoreAtividades),
    problemasPropriedades
  };
}

function encontrarMatchesPossiveis(propriedadeBusca, properties) {
  const normalizada = propriedadeBusca.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/\n/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const matches = [];
  
  for (const property of properties) {
    let score = calcularScore(normalizada, property.name);
    
    // Verificar aliases
    if (property.aliases && Array.isArray(property.aliases)) {
      for (const alias of property.aliases) {
        const aliasScore = calcularScore(normalizada, alias);
        score = Math.max(score, aliasScore);
      }
    }
    
    if (score >= 40) { // Threshold baixo para análise
      matches.push({ name: property.name, score, id: property.id });
    }
  }
  
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function calcularScore(nome1, nome2) {
  const normalizado1 = nome1.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/\n/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  const normalizado2 = nome2.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/\n/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (normalizado1 === normalizado2) return 100;
  if (normalizado1.includes(normalizado2) || normalizado2.includes(normalizado1)) return 90;
  
  const palavras1 = normalizado1.split(' ').filter(p => p.length > 2);
  const palavras2 = normalizado2.split(' ').filter(p => p.length > 2);
  
  let palavrasComuns = 0;
  for (const palavra of palavras1) {
    if (palavras2.some(p => p.includes(palavra) || palavra.includes(p))) {
      palavrasComuns++;
    }
  }
  
  if (palavrasComuns > 0) {
    return Math.min(85, (palavrasComuns / Math.max(palavras1.length, palavras2.length)) * 100);
  }
  
  return 0;
}

// Executar verificação
verificarCoberturaPropriedades()
  .then(resultado => {
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log(`🎯 Sistema reconhece ${resultado.propriedadesAtivas}/${resultado.totalPropriedades} propriedades`);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });