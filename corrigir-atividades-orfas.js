/**
 * CORRIGIR ATIVIDADES ÓRFÃS - APLICAÇÃO IMEDIATA DOS ALIASES
 * Atualiza as atividades órfãs que já deveriam ter propriedades identificadas
 */

async function corrigirAtividadesOrfas() {
  console.log('🔧 CORREÇÃO IMEDIATA DE ATIVIDADES ÓRFÃS');
  console.log('========================================');
  
  // Obter dados atuais
  const [activitiesResponse, propertiesResponse] = await Promise.all([
    fetch('http://localhost:5000/api/activities'),
    fetch('http://localhost:5000/api/properties')
  ]);
  
  const activitiesData = await activitiesResponse.json();
  const properties = await propertiesResponse.json();
  
  const atividades = activitiesData.activities;
  const orfas = atividades.filter(a => a.entityId === null);
  
  console.log(`📊 Estado atual: ${atividades.length} total, ${orfas.length} órfãs`);
  
  let corrigidas = 0;
  const correcoes = [];
  
  // Casos específicos que devem resolver
  const mapeamento = {
    'A203': { propriedade: 'Costa blue', id: 30 },
    'Almada 1': { propriedade: 'Bernardo', id: 11 },
    'São João\nBatista T3': { propriedade: 'Nazaré T2', id: 20 },
    'Almada 1 Bernardo T3': { propriedade: 'Bernardo', id: 11 }
  };
  
  for (const atividade of orfas) {
    const desc = atividade.description || '';
    console.log(`\n🔍 Analisando ID ${atividade.id}: "${desc}"`);
    
    // Extrair nome da propriedade da descrição
    const match = desc.match(/(.+?)\s*-\s*(.+)/);
    if (!match) {
      console.log(`   ⚠️ Formato não reconhecido`);
      continue;
    }
    
    const [, hospedeRaw, propriedadeRaw] = match;
    const propriedade = propriedadeRaw.trim().replace(/\s+/g, ' ');
    
    console.log(`   📝 Propriedade extraída: "${propriedade}"`);
    
    // Verificar mapeamento direto
    let matchFound = null;
    for (const [key, value] of Object.entries(mapeamento)) {
      if (propriedade.includes(key.replace('\n', ' ')) || 
          propriedade.includes(key) ||
          propriedade.replace(/\s+/g, ' ').includes(key.replace('\n', ' '))) {
        matchFound = value;
        console.log(`   ✅ Match direto encontrado: ${key} → ${value.propriedade}`);
        break;
      }
    }
    
    // Se não encontrou match direto, usar algoritmo de matching
    if (!matchFound) {
      matchFound = encontrarPropriedade(propriedade, properties);
      if (matchFound) {
        console.log(`   ✅ Match por algoritmo: ${matchFound.propriedade} (${matchFound.score}%)`);
      }
    }
    
    if (matchFound) {
      try {
        // Atualizar atividade com a propriedade
        const updateResponse = await fetch(`http://localhost:5000/api/activities/${atividade.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entityId: matchFound.id,
            entityType: 'property'
          })
        });
        
        if (updateResponse.ok) {
          console.log(`   ✅ CORRIGIDO: Atividade ${atividade.id} → ${matchFound.propriedade}`);
          corrigidas++;
          correcoes.push({
            id: atividade.id,
            propriedadeAntes: propriedade,
            propriedadeDepois: matchFound.propriedade,
            score: matchFound.score || 100
          });
        } else {
          console.log(`   ❌ Erro na atualização: ${updateResponse.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    } else {
      console.log(`   ❌ Nenhum match encontrado para "${propriedade}"`);
    }
  }
  
  // Verificar resultado
  const finalResponse = await fetch('http://localhost:5000/api/activities');
  const finalData = await finalResponse.json();
  const finalAtividades = finalData.activities;
  
  const totalFinal = finalAtividades.length;
  const comPropriedadeFinal = finalAtividades.filter(a => a.entityId !== null).length;
  const scoreFinal = ((comPropriedadeFinal / totalFinal) * 100).toFixed(1);
  
  console.log('\n🏆 RESULTADO DA CORREÇÃO:');
  console.log(`📊 Score final: ${scoreFinal}% (${comPropriedadeFinal}/${totalFinal})`);
  console.log(`✅ Atividades corrigidas: ${corrigidas}`);
  console.log(`📈 Melhoria estimada: +${(corrigidas * 2.94).toFixed(1)}%`);
  
  if (correcoes.length > 0) {
    console.log('\n📋 CORREÇÕES APLICADAS:');
    correcoes.forEach(c => {
      console.log(`   ID ${c.id}: "${c.propriedadeAntes}" → ${c.propriedadeDepois} (${c.score}%)`);
    });
  }
  
  return {
    scoreAntes: 47.1,
    scoreFinal: parseFloat(scoreFinal),
    corrigidas,
    correcoes
  };
}

function encontrarPropriedade(nomeBusca, properties) {
  const nomeBuscaNormalizado = nomeBusca.toLowerCase()
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
      bestMatch = { 
        propriedade: property.name, 
        id: property.id, 
        score 
      };
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

// Executar correção
corrigirAtividadesOrfas()
  .then(resultado => {
    console.log('\n✅ CORREÇÃO DE ATIVIDADES ÓRFÃS CONCLUÍDA!');
    const melhoria = (resultado.scoreFinal - resultado.scoreAntes).toFixed(1);
    console.log(`🎯 Melhoria alcançada: ${resultado.scoreAntes}% → ${resultado.scoreFinal}% (+${melhoria}%)`);
    
    if (resultado.scoreFinal >= 70) {
      console.log('🎉 EXCELENTE! Score de 70%+ alcançado!');
    } else if (resultado.scoreFinal >= 60) {
      console.log('✅ MUITO BOM! Score de 60%+ alcançado!');
    } else if (parseFloat(melhoria) > 0) {
      console.log('👍 PROGRESSO! Melhorias aplicadas com sucesso!');
    }
  })
  .catch(error => {
    console.error('❌ Erro na correção:', error);
  });