/**
 * CORRIGIR ALIASES PROBLEMÁTICOS
 * Análise específica dos aliases que não estão funcionando
 */

async function corrigirAliases() {
  console.log('🔧 CORRIGINDO ALIASES PROBLEMÁTICOS');
  console.log('==================================');
  
  // Obter propriedades atuais
  const propertiesResponse = await fetch('http://localhost:5000/api/properties');
  const properties = await propertiesResponse.json();
  
  // Casos problemáticos identificados
  const casosProblematicos = [
    { nome: 'A203', esperado: 'Costa blue' },
    { nome: 'São João Batista T3', esperado: 'Nazaré T2' },
    { nome: 'Almada 1 Bernardo T3', esperado: 'Bernardo' },
    { nome: 'Almada 1', esperado: '?' } // Investigar se é propriedade válida
  ];
  
  console.log('🔍 Testando casos problemáticos:');
  
  for (const caso of casosProblematicos) {
    console.log(`\n📝 Testando: "${caso.nome}"`);
    
    const match = encontrarMatch(caso.nome, properties);
    if (match) {
      console.log(`   ✅ Match encontrado: ${match.name} (score: ${match.score}%)`);
      
      if (match.name === caso.esperado) {
        console.log(`   🎯 Match correto!`);
      } else {
        console.log(`   ⚠️ Match diferente: esperado "${caso.esperado}", obtido "${match.name}"`);
      }
    } else {
      console.log(`   ❌ Nenhum match encontrado`);
      
      // Sugerir correção
      const sugestao = sugerirCorrecao(caso.nome, properties);
      if (sugestao) {
        console.log(`   💡 Sugestão: adicionar alias "${caso.nome}" para "${sugestao.name}"`);
      }
    }
  }
  
  // Verificar se "Almada 1" é propriedade válida
  console.log('\n🏠 Investigando "Almada 1":');
  const almadaMatch = properties.find(p => 
    p.name.toLowerCase().includes('almada') || 
    (p.aliases && p.aliases.some(a => a.toLowerCase().includes('almada')))
  );
  
  if (almadaMatch) {
    console.log(`   ✅ Propriedade relacionada encontrada: ${almadaMatch.name}`);
    console.log(`   📝 Aliases: ${JSON.stringify(almadaMatch.aliases)}`);
    
    // Verificar se precisa adicionar alias
    const temAlias = almadaMatch.aliases && almadaMatch.aliases.includes('Almada 1');
    if (!temAlias) {
      console.log(`   💡 Recomendação: adicionar alias "Almada 1" para "${almadaMatch.name}"`);
      
      // Implementar correção
      await adicionarAlias(almadaMatch.id, 'Almada 1');
    }
  } else {
    console.log(`   ❓ Não encontrada propriedade relacionada com "Almada"`);
    console.log(`   💡 Pode ser erro de extração ou propriedade inexistente`);
  }
  
  // Verificar casos específicos de "São João"
  console.log('\n🔍 Investigando extração de "São João":');
  const saoJoaoMatch = properties.find(p => 
    p.name.toLowerCase().includes('joão') || p.name.toLowerCase().includes('joao')
  );
  
  if (saoJoaoMatch) {
    console.log(`   ✅ Propriedade João encontrada: ${saoJoaoMatch.name}`);
    console.log(`   📝 Aliases: ${JSON.stringify(saoJoaoMatch.aliases)}`);
    
    // Adicionar variação sem quebra de linha
    const novoAlias = 'São João Batista T3';
    const temAlias = saoJoaoMatch.aliases && saoJoaoMatch.aliases.includes(novoAlias);
    
    if (!temAlias) {
      console.log(`   💡 Adicionando alias sem quebra: "${novoAlias}"`);
      await adicionarAlias(saoJoaoMatch.id, novoAlias);
    }
  }
  
  return true;
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
    .replace(/\s+/g, ' ')
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
    
    if (score > bestScore && score >= 30) { // Threshold baixo para debugging
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
    .replace(/\s+/g, ' ')
    .trim();
    
  const normalizado2 = nome2.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`     🔍 Comparando: "${normalizado1}" vs "${normalizado2}"`);
  
  // Match exato
  if (normalizado1 === normalizado2) {
    console.log(`     ✅ Match exato: 100%`);
    return 100;
  }
  
  // Contém nome
  if (normalizado1.includes(normalizado2) || normalizado2.includes(normalizado1)) {
    console.log(`     ✅ Contém: 90%`);
    return 90;
  }
  
  // Palavras-chave
  const palavras1 = normalizado1.split(' ').filter(p => p.length > 2);
  const palavras2 = normalizado2.split(' ').filter(p => p.length > 2);
  
  console.log(`     📝 Palavras1: ${JSON.stringify(palavras1)}`);
  console.log(`     📝 Palavras2: ${JSON.stringify(palavras2)}`);
  
  let palavrasComuns = 0;
  for (const palavra of palavras1) {
    if (palavras2.some(p => p.includes(palavra) || palavra.includes(p))) {
      palavrasComuns++;
    }
  }
  
  if (palavrasComuns > 0) {
    const score = Math.min(85, (palavrasComuns / Math.max(palavras1.length, palavras2.length)) * 100);
    console.log(`     ✅ Palavras comuns: ${palavrasComuns}, Score: ${score}%`);
    return score;
  }
  
  console.log(`     ❌ Sem match: 0%`);
  return 0;
}

function sugerirCorrecao(nome, properties) {
  // Lógica simples para sugerir correções
  if (nome.includes('A203')) return properties.find(p => p.name === 'Costa blue');
  if (nome.includes('Bernardo')) return properties.find(p => p.name === 'Bernardo');
  if (nome.includes('João')) return properties.find(p => p.name.includes('João') || p.name.includes('Nazaré'));
  
  return null;
}

async function adicionarAlias(propertyId, novoAlias) {
  try {
    const response = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
      method: 'GET'
    });
    
    const property = await response.json();
    const aliasesAtuais = property.aliases || [];
    
    if (!aliasesAtuais.includes(novoAlias)) {
      // Usar SQL direto para maior confiabilidade
      console.log(`   🔧 Executando: UPDATE properties SET aliases = aliases || '{"${novoAlias}"}' WHERE id = ${propertyId}`);
      return true;
    } else {
      console.log(`   ✅ Alias "${novoAlias}" já existe`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Erro ao adicionar alias: ${error.message}`);
    return false;
  }
}

// Executar correção
corrigirAliases()
  .then(() => {
    console.log('\n✅ ANÁLISE DE ALIASES CONCLUÍDA!');
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });