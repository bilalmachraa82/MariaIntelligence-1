/**
 * TESTAR MELHORIAS DOS ALIASES
 * Simula re-processamento das atividades órfãs para verificar se agora conseguem matching
 */

async function testarMelhorias() {
  console.log('🧪 TESTANDO MELHORIAS DOS ALIASES');
  console.log('=================================');
  
  // Verificar estado atual
  const response = await fetch('http://localhost:5000/api/activities');
  const data = await response.json();
  const atividades = data.activities;
  
  const total = atividades.length;
  const comPropriedade = atividades.filter(a => a.entityId !== null).length;
  const scoreAntes = ((comPropriedade / total) * 100).toFixed(1);
  
  console.log(`📊 Score antes das melhorias: ${scoreAntes}% (${comPropriedade}/${total})`);
  
  // Obter propriedades atualizadas
  const propertiesResponse = await fetch('http://localhost:5000/api/properties');
  const properties = await propertiesResponse.json();
  
  console.log('\n🔍 Testando matching com novos aliases:');
  
  const testeCases = [
    { nome: 'A203', esperado: 'Costa blue' },
    { nome: 'Almada 1 Bernardo T3', esperado: 'Bernardo' },
    { nome: 'São João Batista T3', esperado: 'Nazaré T2' },
    { nome: 'Bernardo T3', esperado: 'Bernardo' }
  ];
  
  let melhorias = 0;
  
  for (const teste of testeCases) {
    console.log(`\n📝 Testando: "${teste.nome}"`);
    
    const match = encontrarMatch(teste.nome, properties);
    if (match) {
      console.log(`   ✅ Match encontrado: ${match.name} (score: ${match.score}%)`);
      if (match.name === teste.esperado) {
        console.log(`   🎯 Match correto!`);
        melhorias++;
      } else {
        console.log(`   ⚠️ Match diferente do esperado (${teste.esperado})`);
      }
    } else {
      console.log(`   ❌ Nenhum match encontrado`);
    }
  }
  
  // Simular impacto das melhorias
  const scorePotencial = ((comPropriedade + melhorias) / total * 100).toFixed(1);
  const melhoria = (scorePotencial - scoreAntes).toFixed(1);
  
  console.log('\n📈 IMPACTO DAS MELHORIAS:');
  console.log(`   Score atual: ${scoreAntes}%`);
  console.log(`   Testes bem-sucedidos: ${melhorias}/4`);
  console.log(`   Score potencial: ${scorePotencial}%`);
  console.log(`   Melhoria potencial: +${melhoria}%`);
  
  if (melhorias >= 3) {
    console.log('\n🌟 EXCELENTE! Aliases funcionando muito bem');
  } else if (melhorias >= 2) {
    console.log('\n✅ BOM! Algumas melhorias significativas');
  } else {
    console.log('\n⚠️ Aliases precisam de mais ajustes');
  }
  
  return {
    scoreAntes: parseFloat(scoreAntes),
    scorePotencial: parseFloat(scorePotencial),
    melhorias,
    melhoria: parseFloat(melhoria)
  };
}

function encontrarMatch(nomeBusca, properties) {
  const nomeBuscaNormalizado = nomeBusca.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const property of properties) {
    // Testar nome principal
    let score = calcularScore(nomeBuscaNormalizado, property.name);
    
    // Testar aliases
    if (property.aliases && Array.isArray(property.aliases)) {
      for (const alias of property.aliases) {
        const aliasScore = calcularScore(nomeBuscaNormalizado, alias);
        score = Math.max(score, aliasScore);
      }
    }
    
    if (score > bestScore && score >= 60) {
      bestScore = score;
      bestMatch = { ...property, score };
    }
  }
  
  return bestMatch;
}

function calcularScore(nome1, nome2) {
  const normalizado1 = nome1.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
    
  const normalizado2 = nome2.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
  
  // Match exato
  if (normalizado1 === normalizado2) return 100;
  
  // Contém nome
  if (normalizado1.includes(normalizado2) || normalizado2.includes(normalizado1)) return 90;
  
  // Palavras-chave
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

// Executar teste
testarMelhorias()
  .then(resultado => {
    console.log('\n✅ TESTE DE MELHORIAS CONCLUÍDO!');
    if (resultado.melhoria > 0) {
      console.log(`🎯 Potencial de melhoria: +${resultado.melhoria}%`);
    }
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });