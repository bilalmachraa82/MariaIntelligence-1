/**
 * ANÁLISE DETALHADA: O que falta para 100%
 * Identifica lacunas específicas e erros encontrados no sistema
 */

async function analisarProblemasEspecificos() {
  console.log('🔍 ANÁLISE DETALHADA PARA 100%');
  console.log('=============================');
  
  // 1. Obter estado atual
  const response = await fetch('http://localhost:5000/api/activities');
  const data = await response.json();
  const atividades = data.activities;
  
  const total = atividades.length;
  const comPropriedade = atividades.filter(a => a.entityId !== null).length;
  const semPropriedade = atividades.filter(a => a.entityId === null).length;
  const scoreAtual = ((comPropriedade / total) * 100).toFixed(1);
  
  console.log(`📊 ESTADO ATUAL:`);
  console.log(`   Total: ${total} atividades`);
  console.log(`   ✅ Com propriedade: ${comPropriedade}`);
  console.log(`   ❌ Sem propriedade: ${semPropriedade}`);
  console.log(`   📈 Score atual: ${scoreAtual}%`);
  
  // 2. Analisar atividades órfãs detalhadamente
  console.log('\n🔍 ANÁLISE DAS ATIVIDADES ÓRFÃS:');
  const orfas = atividades.filter(a => a.entityId === null);
  
  const padroes = {};
  orfas.forEach(atividade => {
    const desc = atividade.description || '';
    console.log(`   📝 ID ${atividade.id}: "${desc}"`);
    
    // Extrair padrões
    const match = desc.match(/(.+?)\s*-\s*(.+)/);
    if (match) {
      const [, possivel_hospede, possivel_propriedade] = match;
      const propriedade = possivel_propriedade.trim();
      
      if (!padroes[propriedade]) {
        padroes[propriedade] = { count: 0, exemplos: [] };
      }
      padroes[propriedade].count++;
      padroes[propriedade].exemplos.push({
        id: atividade.id,
        hospede: possivel_hospede.trim(),
        desc
      });
    }
  });
  
  // 3. Identificar problemas por padrão
  console.log('\n📋 PADRÕES IDENTIFICADOS:');
  const problemas = [];
  
  for (const [propriedade, info] of Object.entries(padroes)) {
    console.log(`\n🏠 "${propriedade}" (${info.count} atividades):`);
    info.exemplos.forEach(ex => {
      console.log(`   - ID ${ex.id}: ${ex.hospede}`);
    });
    
    problemas.push({
      propriedade,
      count: info.count,
      exemplos: info.exemplos,
      tipo: classificarProblema(propriedade)
    });
  }
  
  // 4. Calcular soluções específicas
  console.log('\n🎯 SOLUÇÕES IDENTIFICADAS:');
  const solucoes = calcularSolucoesParaProblemas(problemas);
  
  let potencialMelhoria = 0;
  solucoes.forEach(sol => {
    console.log(`\n${sol.icone} ${sol.titulo}:`);
    console.log(`   📊 Impact: +${sol.impacto} atividades (+${sol.percentual}%)`);
    console.log(`   🔧 Ação: ${sol.acao}`);
    console.log(`   ⏱️ Tempo: ${sol.tempo}`);
    potencialMelhoria += sol.impacto;
  });
  
  // 5. Cálculo para 100%
  const scoreProjetado = ((comPropriedade + potencialMelhoria) / total * 100).toFixed(1);
  const restante = total - (comPropriedade + potencialMelhoria);
  
  console.log('\n🏆 PROJEÇÃO PARA 100%:');
  console.log(`   📈 Score atual: ${scoreAtual}%`);
  console.log(`   🎯 Score com soluções: ${scoreProjetado}%`);
  console.log(`   📊 Melhoria potencial: +${potencialMelhoria} atividades`);
  console.log(`   ❓ Restantes não resolvidos: ${restante}`);
  
  if (restante === 0) {
    console.log('\n🌟 EXCELENTE! Todas as atividades podem ser resolvidas!');
  } else if (restante <= 2) {
    console.log('\n✅ MUITO BOM! Quase todas as atividades resolvidas!');
  } else {
    console.log(`\n⚠️ ${restante} atividades precisarão de investigação manual`);
  }
  
  // 6. Priorização de ações
  console.log('\n📋 PLANO DE AÇÃO PRIORIZADO:');
  const acoesPriorizadas = priorizarAcoes(solucoes);
  acoesPriorizadas.forEach((acao, i) => {
    console.log(`   ${i+1}. ${acao.titulo} (${acao.impacto} atividades, ${acao.tempo})`);
  });
  
  return {
    scoreAtual: parseFloat(scoreAtual),
    scoreProjetado: parseFloat(scoreProjetado),
    potencialMelhoria,
    restante,
    problemas,
    solucoes,
    acoesPriorizadas
  };
}

function classificarProblema(propriedade) {
  const prop = propriedade.toLowerCase();
  
  if (prop.includes('propriedade desconhecida')) return 'PROPRIEDADE_DESCONHECIDA';
  if (prop.includes('almada')) return 'ALIAS_FALTANDO';
  if (prop.includes('a203') || prop.includes('t3') || prop.includes('t2')) return 'CODIGO_PROPRIEDADE';
  if (prop.includes('todos') || prop.includes('edif')) return 'NOME_AMBIGUO';
  
  return 'OUTROS';
}

function calcularSolucoesParaProblemas(problemas) {
  const solucoes = [];
  
  // Agrupar por tipo de problema
  const porTipo = {};
  problemas.forEach(p => {
    if (!porTipo[p.tipo]) porTipo[p.tipo] = [];
    porTipo[p.tipo].push(p);
  });
  
  // Solução 1: Aliases estratégicos
  if (porTipo.ALIAS_FALTANDO || porTipo.CODIGO_PROPRIEDADE) {
    const count = (porTipo.ALIAS_FALTANDO?.reduce((a,b) => a + b.count, 0) || 0) +
                  (porTipo.CODIGO_PROPRIEDADE?.reduce((a,b) => a + b.count, 0) || 0);
    
    solucoes.push({
      icone: '🔗',
      titulo: 'Adicionar aliases para códigos de propriedades',
      impacto: count,
      percentual: (count * 2.94).toFixed(1), // baseado em 34 total
      acao: 'UPDATE properties SET aliases = aliases || \'{"novo_alias"}\' WHERE...',
      tempo: '30 min',
      prioridade: 1
    });
  }
  
  // Solução 2: Investigação manual
  if (porTipo.PROPRIEDADE_DESCONHECIDA) {
    const count = porTipo.PROPRIEDADE_DESCONHECIDA.reduce((a,b) => a + b.count, 0);
    
    solucoes.push({
      icone: '🔍',
      titulo: 'Investigar "Propriedade desconhecida"',
      impacto: Math.floor(count * 0.7), // 70% de sucesso estimado
      percentual: (Math.floor(count * 0.7) * 2.94).toFixed(1),
      acao: 'Analisar PDFs originais manualmente',
      tempo: '1-2 horas',
      prioridade: 2
    });
  }
  
  // Solução 3: Processar PDFs restantes
  solucoes.push({
    icone: '📄',
    titulo: 'Processar PDFs restantes (16 arquivos)',
    impacto: 8, // estimativa conservadora
    percentual: (8 * 2.94).toFixed(1),
    acao: 'node processar-pdfs-restantes.js',
    tempo: '2-3 horas',
    prioridade: 3
  });
  
  return solucoes;
}

function priorizarAcoes(solucoes) {
  return solucoes.sort((a, b) => {
    // Priorizar por impacto/tempo
    const ratioA = a.impacto / parseFloat(a.tempo.match(/\d+/)[0]);
    const ratioB = b.impacto / parseFloat(b.tempo.match(/\d+/)[0]);
    return ratioB - ratioA;
  });
}

async function executarAnalise() {
  try {
    const resultado = await analisarProblemasEspecificos();
    
    console.log('\n✅ ANÁLISE COMPLETA!');
    console.log(`🎯 Para chegar a 100%: resolver ${resultado.restante} atividades restantes`);
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Executar análise
executarAnalise();