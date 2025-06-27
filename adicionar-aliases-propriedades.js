/**
 * Script para adicionar aliases às propriedades restantes
 * Baseado nos nomes encontrados nos PDFs processados
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Mapeamento de aliases baseado nos PDFs analisados
const ALIASES_PROPRIEDADES = {
  'Nazaré T2': ['Nazare T2', 'Nazaré Apartamento', 'Nazare Apartamento'],
  'Ajuda': ['Ajuda Apartamento', 'Lisboa Ajuda'],
  'Bernardo': ['São Bernardo', 'Bernardo Apartamento'],
  'Costa cabanas': ['Costa das Cabanas', 'Cabanas Costa'],
  'Cristo Rei': ['Cristo Rei Almada', 'Almada Cristo Rei'],
  'Ericeira nova': ['Ericeira Nova Casa', 'Nova Ericeira'],
  'Gomeira': ['Gomeira Casa', 'Casa da Gomeira'],
  'Magoito anexo': ['Magoito Anexo Casa', 'Anexo Magoito'],
  'Magoito vivenda': ['Magoito Vivenda Principal', 'Vivenda Magoito'],
  'Montemor': ['Montemor Casa', 'Montemor-o-Novo'],
  'Palmela': ['Palmela Casa', 'Palmela Apartamento'],
  'Reboleira': ['Reboleira Apartamento', 'Amadora Reboleira'],
  'Sé': ['Sé Lisboa', 'Lisboa Sé', 'Centro Histórico'],
  'Trafaria 1ª': ['Trafaria Primeira', 'Trafaria 1'],
  'Trafaria RC': ['Trafaria RC Apartamento', 'Trafaria Rés-do-Chão'],
  'Óbidos': ['Óbidos Casa', 'Obidos'],
  'Setubal': ['Setúbal', 'Setubal Casa', 'Setúbal Apartamento'],
  'Costa blue': ['Costa Blue Apartamento', 'Apartamento Costa Blue'],
  'Tropical': ['Tropical Casa', 'Casa Tropical'],
  'Praia chic': ['Praia Chic Apartamento', 'Apartamento Praia Chic'],
  'Maresia': ['Maresia Casa', 'Casa Maresia'],
  'Escandinavo': ['Escandinavo Apartamento', 'Apartamento Escandinavo'],
  'Aroeira 1': ['Aroeira I', 'Aroeira 1 Apartamento', 'Aroeira Villa 1'],
  'Silves': ['Silves Casa', 'Silves Algarve']
};

async function adicionarAliases() {
  console.log('🔧 ADICIONANDO ALIASES ÀS PROPRIEDADES');
  console.log('=' .repeat(40));
  
  let contadorAtualizacoes = 0;
  
  for (const [nomePropriedade, aliases] of Object.entries(ALIASES_PROPRIEDADES)) {
    try {
      console.log(`\n📍 Atualizando: ${nomePropriedade}`);
      console.log(`   Aliases: [${aliases.join(', ')}]`);
      
      const resultado = await sql`
        UPDATE properties 
        SET aliases = ${aliases}
        WHERE name = ${nomePropriedade}
      `;
      
      if (resultado.rowCount > 0) {
        console.log(`   ✅ Atualizado com sucesso`);
        contadorAtualizacoes++;
      } else {
        console.log(`   ⚠️ Propriedade não encontrada na BD`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   Propriedades atualizadas: ${contadorAtualizacoes}`);
  console.log(`   Total de aliases adicionados: ${Object.values(ALIASES_PROPRIEDADES).flat().length}`);
  
  return contadorAtualizacoes;
}

async function validarAtualizacoes() {
  console.log('\n🔍 VALIDANDO ATUALIZAÇÕES...');
  
  try {
    const propriedades = await sql`
      SELECT name, aliases 
      FROM properties 
      WHERE aliases IS NOT NULL AND array_length(aliases, 1) > 0
      ORDER BY name
    `;
    
    console.log(`\n✅ Propriedades com aliases configurados: ${propriedades.length}`);
    
    propriedades.forEach(prop => {
      console.log(`   - ${prop.name}: [${prop.aliases.join(', ')}]`);
    });
    
    // Contar propriedades sem aliases
    const semAliases = await sql`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE aliases IS NULL OR array_length(aliases, 1) = 0
    `;
    
    console.log(`\n⚠️ Propriedades ainda sem aliases: ${semAliases[0].count}`);
    
    return {
      comAliases: propriedades.length,
      semAliases: parseInt(semAliases[0].count)
    };
    
  } catch (error) {
    console.log(`❌ Erro na validação: ${error.message}`);
    return null;
  }
}

async function executar() {
  try {
    console.log('🚀 INICIANDO CONFIGURAÇÃO DE ALIASES');
    
    const atualizacoes = await adicionarAliases();
    const validacao = await validarAtualizacoes();
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`   Atualizações aplicadas: ${atualizacoes}`);
    if (validacao) {
      console.log(`   Propriedades configuradas: ${validacao.comAliases}`);
      console.log(`   Propriedades pendentes: ${validacao.semAliases}`);
      
      const percentual = ((validacao.comAliases / (validacao.comAliases + validacao.semAliases)) * 100).toFixed(1);
      console.log(`   Percentual concluído: ${percentual}%`);
    }
    
    console.log('\n✅ CONFIGURAÇÃO DE ALIASES CONCLUÍDA!');
    
  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
  }
}

executar();