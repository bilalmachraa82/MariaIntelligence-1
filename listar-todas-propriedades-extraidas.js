/**
 * LISTAR TODAS AS PROPRIEDADES EXTRAÍDAS DOS PDFs
 * Extrai todos os nomes de propriedades encontrados para mapeamento manual
 */

async function listarTodasPropriedadesExtraidas() {
  console.log('📋 LISTA COMPLETA DE PROPRIEDADES EXTRAÍDAS DOS PDFs');
  console.log('==================================================');
  
  // Obter todas as atividades
  const response = await fetch('http://localhost:5000/api/activities');
  const data = await response.json();
  const atividades = data.activities;
  
  console.log(`📊 Total de atividades analisadas: ${atividades.length}`);
  
  // Extrair nomes de propriedades de todas as atividades
  const propriedadesExtraidas = new Map();
  
  atividades.forEach(atividade => {
    const desc = atividade.description || '';
    
    // Pular atividades que não são de PDF
    if (!desc.includes('PDF processado:')) {
      return;
    }
    
    // Extrair propriedade da descrição
    const match = desc.match(/PDF processado:\s*(.+?)\s*-\s*(.+)/);
    if (match) {
      const hospede = match[1].trim();
      const propriedade = match[2].trim().replace(/\s+/g, ' ');
      
      if (!propriedadesExtraidas.has(propriedade)) {
        propriedadesExtraidas.set(propriedade, {
          count: 0,
          hospedes: new Set(),
          atividades: [],
          reconhecida: atividade.entityId !== null
        });
      }
      
      const info = propriedadesExtraidas.get(propriedade);
      info.count++;
      info.hospedes.add(hospede);
      info.atividades.push(atividade.id);
      
      // Se pelo menos uma atividade foi reconhecida, marcar como reconhecida
      if (atividade.entityId !== null) {
        info.reconhecida = true;
      }
    }
  });
  
  // Obter propriedades do sistema para referência
  const propertiesResponse = await fetch('http://localhost:5000/api/properties');
  const systemProperties = await propertiesResponse.json();
  
  console.log('\n🏠 PROPRIEDADES DO SISTEMA:');
  systemProperties.forEach(prop => {
    console.log(`   ${prop.id}. ${prop.name}`);
    if (prop.aliases && prop.aliases.length > 0) {
      console.log(`      Aliases: ${prop.aliases.join(', ')}`);
    }
  });
  
  // Ordenar propriedades extraídas: reconhecidas primeiro, depois por contagem
  const propriedadesOrdenadas = Array.from(propriedadesExtraidas.entries())
    .sort((a, b) => {
      // Primeiro por reconhecimento
      if (a[1].reconhecida !== b[1].reconhecida) {
        return b[1].reconhecida - a[1].reconhecida;
      }
      // Depois por contagem
      return b[1].count - a[1].count;
    });
  
  console.log('\n📋 TODAS AS PROPRIEDADES EXTRAÍDAS DOS PDFs:');
  console.log('===========================================');
  
  propriedadesOrdenadas.forEach(([nomeExtraido, info], index) => {
    const status = info.reconhecida ? '✅ RECONHECIDA' : '❌ NÃO RECONHECIDA';
    console.log(`\n${index + 1}. "${nomeExtraido}" - ${info.count} atividades - ${status}`);
    console.log(`   Atividades: ${info.atividades.join(', ')}`);
    console.log(`   Hóspedes únicos: ${Array.from(info.hospedes).slice(0, 3).join(', ')}${info.hospedes.size > 3 ? '...' : ''}`);
  });
  
  // Resumo estatístico
  const totalExtraidas = propriedadesExtraidas.size;
  const reconhecidas = Array.from(propriedadesExtraidas.values()).filter(p => p.reconhecida).length;
  const naoReconhecidas = totalExtraidas - reconhecidas;
  
  console.log('\n📊 RESUMO:');
  console.log(`   Total propriedades extraídas: ${totalExtraidas}`);
  console.log(`   ✅ Reconhecidas: ${reconhecidas}`);
  console.log(`   ❌ Não reconhecidas: ${naoReconhecidas}`);
  
  // Lista específica para mapeamento
  console.log('\n🎯 LISTA PARA MAPEAMENTO:');
  console.log('========================');
  console.log('Por favor, diga a correspondência de cada propriedade NÃO RECONHECIDA:');
  
  let contador = 1;
  propriedadesOrdenadas.forEach(([nomeExtraido, info]) => {
    if (!info.reconhecida) {
      console.log(`${contador}. "${nomeExtraido}" → ID da propriedade do sistema: ___`);
      contador++;
    }
  });
  
  console.log('\nReferência - IDs das propriedades do sistema:');
  systemProperties.forEach(prop => {
    console.log(`   ${prop.id} = ${prop.name}`);
  });
  
  return {
    totalExtraidas,
    reconhecidas,
    naoReconhecidas,
    propriedadesExtraidas: Array.from(propriedadesExtraidas.entries())
  };
}

// Executar listagem
listarTodasPropriedadesExtraidas()
  .then(resultado => {
    console.log('\n✅ LISTAGEM CONCLUÍDA!');
    console.log(`🎯 ${resultado.naoReconhecidas} propriedades precisam de mapeamento manual`);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });