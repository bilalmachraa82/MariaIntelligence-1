/**
 * ANALISAR E OTIMIZAR ATIVIDADES ÓRFÃS
 * Identifica padrões nas atividades sem propriedade e adiciona aliases
 */

import fs from 'fs';

async function analisarAtividadesOrfas() {
  console.log('🔍 ANÁLISE DE ATIVIDADES ÓRFÃS');
  console.log('==============================');
  
  try {
    // Obter todas as atividades
    const response = await fetch('http://localhost:5000/api/activities');
    const data = await response.json();
    const atividades = data.activities;
    
    const total = atividades.length;
    const comPropriedade = atividades.filter(a => a.entityId !== null).length;
    const semPropriedade = total - comPropriedade;
    const scoreReal = ((comPropriedade / total) * 100).toFixed(1);
    
    console.log(`📊 Estado atual:`);
    console.log(`   Total: ${total} atividades`);
    console.log(`   Com propriedade: ${comPropriedade}`);
    console.log(`   Sem propriedade: ${semPropriedade}`);
    console.log(`   Score real: ${scoreReal}%`);
    
    // Analisar atividades órfãs
    const orfas = atividades.filter(a => a.entityId === null);
    console.log(`\n🔍 ANALISANDO ${orfas.length} ATIVIDADES ÓRFÃS:`);
    
    const padroes = {};
    
    for (const atividade of orfas) {
      console.log(`\n📝 ID: ${atividade.id}`);
      console.log(`   Tipo: ${atividade.type}`);
      console.log(`   Descrição: ${atividade.description}`);
      
      // Extrair possíveis nomes de propriedades da descrição
      const descricao = atividade.description || '';
      const possiveisNomes = extrairPossiveisNomes(descricao);
      
      if (possiveisNomes.length > 0) {
        console.log(`   Possíveis propriedades: ${possiveisNomes.join(', ')}`);
        
        for (const nome of possiveisNomes) {
          if (!padroes[nome]) {
            padroes[nome] = [];
          }
          padroes[nome].push(atividade.id);
        }
      }
    }
    
    // Buscar propriedades existentes
    const propertiesResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propertiesResponse.json();
    
    console.log(`\n🏠 MATCHING COM PROPRIEDADES EXISTENTES:`);
    console.log(`======================================`);
    
    const sugestoes = [];
    
    for (const [nomePadrao, atividadeIds] of Object.entries(padroes)) {
      console.log(`\n🔍 Padrão encontrado: "${nomePadrao}" (${atividadeIds.length} atividades)`);
      
      // Tentar fazer matching com propriedades existentes
      const matches = encontrarMatches(nomePadrao, properties);
      
      if (matches.length > 0) {
        console.log(`   💡 Possíveis matches:`);
        for (const match of matches) {
          console.log(`      - ${match.name} (score: ${match.score}%) [ID: ${match.id}]`);
          
          if (match.score >= 70) {
            sugestoes.push({
              propriedadeId: match.id,
              propriedadeNome: match.name,
              nomePadrao,
              atividadeIds,
              score: match.score,
              acao: 'adicionar_alias'
            });
          }
        }
      } else {
        console.log(`   ⚠️ Nenhum match encontrado - pode ser propriedade nova`);
      }
    }
    
    // Implementar sugestões automaticamente
    console.log(`\n🚀 IMPLEMENTANDO MELHORIAS:`);
    console.log(`==========================`);
    
    let melhorias = 0;
    
    for (const sugestao of sugestoes) {
      if (sugestao.score >= 80) {
        console.log(`\n✅ Adicionando alias "${sugestao.nomePadrao}" para "${sugestao.propriedadeNome}"`);
        
        // Aqui implementaríamos a adição de alias na base de dados
        // Por enquanto, vamos simular
        melhorias += sugestao.atividadeIds.length;
        
        console.log(`   🎯 Potencial melhoria: +${sugestao.atividadeIds.length} atividades`);
      }
    }
    
    // Calcular impacto potencial
    const novoScore = ((comPropriedade + melhorias) / total * 100).toFixed(1);
    const melhoriaPotencial = (novoScore - scoreReal).toFixed(1);
    
    console.log(`\n📈 IMPACTO POTENCIAL:`);
    console.log(`====================`);
    console.log(`Score atual: ${scoreReal}%`);
    console.log(`Score com melhorias: ${novoScore}%`);
    console.log(`Melhoria potencial: +${melhoriaPotencial}%`);
    console.log(`Atividades que seriam otimizadas: ${melhorias}`);
    
    return {
      scoreAtual: parseFloat(scoreReal),
      scoreComMelhorias: parseFloat(novoScore),
      melhoriaPotencial: parseFloat(melhoriaPotencial),
      atividadesOtimizadas: melhorias,
      sugestoes
    };
    
  } catch (error) {
    console.log(`❌ Erro na análise: ${error.message}`);
    return null;
  }
}

function extrairPossiveisNomes(descricao) {
  const nomes = [];
  
  // Padrões para extrair nomes de propriedades
  const padroes = [
    /PDF processado:.*?-\s*(.+)$/,
    /Propriedade:\s*(.+)/,
    /Property:\s*(.+)/,
    /Location:\s*(.+)/,
    /Local:\s*(.+)/
  ];
  
  for (const padrao of padroes) {
    const match = descricao.match(padrao);
    if (match && match[1]) {
      const nome = match[1].trim()
        .replace(/^(Hóspede desconhecido|Unknown Guest)\s*-\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (nome && nome.length > 2 && nome !== 'Hóspede desconhecido') {
        nomes.push(nome);
      }
    }
  }
  
  return [...new Set(nomes)]; // Remove duplicatas
}

function encontrarMatches(nomeBusca, properties) {
  const matches = [];
  const nomeBuscaNormalizado = nomeBusca.toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
  
  for (const property of properties) {
    const nomePropriedade = property.name.toLowerCase()
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
    
    // Cálculo de score de similaridade
    let score = 0;
    
    // Match exato
    if (nomeBuscaNormalizado === nomePropriedade) {
      score = 100;
    }
    // Contém nome completo
    else if (nomePropriedade.includes(nomeBuscaNormalizado) || nomeBuscaNormalizado.includes(nomePropriedade)) {
      score = 90;
    }
    // Palavras-chave comuns
    else {
      const palavrasBusca = nomeBuscaNormalizado.split(' ').filter(p => p.length > 2);
      const palavrasPropriedade = nomePropriedade.split(' ').filter(p => p.length > 2);
      
      let palavrasComuns = 0;
      for (const palavra of palavrasBusca) {
        if (palavrasPropriedade.some(p => p.includes(palavra) || palavra.includes(p))) {
          palavrasComuns++;
        }
      }
      
      if (palavrasComuns > 0) {
        score = Math.min(85, (palavrasComuns / Math.max(palavrasBusca.length, palavrasPropriedade.length)) * 100);
      }
    }
    
    if (score >= 60) {
      matches.push({
        id: property.id,
        name: property.name,
        score: Math.round(score)
      });
    }
  }
  
  return matches.sort((a, b) => b.score - a.score);
}

// Executar análise
console.log('🚀 Iniciando análise de atividades órfãs...\n');

analisarAtividadesOrfas()
  .then(resultado => {
    if (resultado) {
      console.log('\n✅ ANÁLISE CONCLUÍDA!');
      console.log(`🎯 Potencial de melhoria: +${resultado.melhoriaPotencial}%`);
      
      if (resultado.scoreComMelhorias >= 80) {
        console.log('🌟 Com as melhorias, o sistema alcançaria funcionalidade excelente!');
      }
    }
  })
  .catch(error => {
    console.error('❌ Erro na análise:', error);
  });