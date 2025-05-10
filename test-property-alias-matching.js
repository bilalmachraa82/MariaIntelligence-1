/**
 * Script para testar a função matchPropertyByAlias
 * Testa diferentes cenários de correspondência de propriedades usando aliases
 */

import { storage } from './server/storage.js';
import { matchPropertyByAlias } from './server/utils/matchPropertyByAlias.js';

async function testPropertyAliasMatching() {
  console.log('🧪 Iniciando testes de correspondência por alias...');
  
  try {
    // Buscar todas as propriedades
    const properties = await storage.getProperties();
    console.log(`📝 Encontradas ${properties.length} propriedades para teste`);

    // Definir casos de teste
    const testCases = [
      // Casos de correspondência exata por nome
      { input: 'Aroeira 3', expectedId: 8, type: 'Nome exato' },
      { input: 'Aroeira 4', expectedId: 9, type: 'Nome exato' },
      
      // Casos de correspondência por alias
      { input: 'Aroeira III', expectedId: 8, type: 'Alias exato' },
      { input: 'Aroeira IV', expectedId: 9, type: 'Alias exato' },
      { input: 'Aroeira 3 Apartamento', expectedId: 8, type: 'Alias exato' },
      { input: 'Aroeira 4 Apartamento', expectedId: 9, type: 'Alias exato' },
      
      // Casos de correspondência parcial
      { input: 'Aroeira Villa 3', expectedId: 8, type: 'Alias exato' },
      { input: 'Aroeira Villa 4', expectedId: 9, type: 'Alias exato' },
      { input: 'Aroeira 3 - Casa de Férias', expectedId: 8, type: 'Correspondência parcial' },
      { input: 'Aroeira 4 - Casa de Férias', expectedId: 9, type: 'Correspondência parcial' },
      
      // Casos com variações e erros de digitação
      { input: 'Aroéira 3', expectedId: 8, type: 'Com acentos' },
      { input: 'aroeira iii', expectedId: 8, type: 'Minúsculas' },
      { input: 'AROEIRA 4', expectedId: 9, type: 'Maiúsculas' },
      { input: 'Aroeira3', expectedId: 8, type: 'Sem espaço' },
      { input: 'Aroeira-4', expectedId: 9, type: 'Com hífen' },
      
      // Casos negativos (não deve encontrar)
      { input: 'Aroeira 5', expectedId: null, type: 'Propriedade inexistente' },
      { input: 'Propridade Qualquer', expectedId: null, type: 'Nome aleatório' }
    ];
    
    // Executar cada caso de teste
    for (const test of testCases) {
      console.log(`\n📌 Testando: "${test.input}" (${test.type})`);
      
      const start = performance.now();
      const matchedProperty = matchPropertyByAlias(test.input, properties);
      const end = performance.now();
      
      if (test.expectedId === null) {
        if (!matchedProperty) {
          console.log('✅ Teste passou: Propriedade corretamente não encontrada');
        } else {
          console.log(`❌ Teste falhou: Deveria não encontrar, mas encontrou a propriedade ${matchedProperty.name} (ID: ${matchedProperty.id})`);
        }
      } else {
        if (matchedProperty && matchedProperty.id === test.expectedId) {
          console.log(`✅ Teste passou: Propriedade "${matchedProperty.name}" (ID: ${matchedProperty.id}) encontrada em ${(end - start).toFixed(2)}ms`);
          
          // Verificar se tem aliases
          if (matchedProperty.aliases && matchedProperty.aliases.length > 0) {
            console.log(`   Aliases: ${matchedProperty.aliases.join(', ')}`);
          }
        } else if (!matchedProperty) {
          console.log(`❌ Teste falhou: Propriedade não encontrada, esperava ID ${test.expectedId}`);
        } else {
          console.log(`❌ Teste falhou: Encontrou propriedade incorreta, ID ${matchedProperty.id} (${matchedProperty.name}), esperava ID ${test.expectedId}`);
        }
      }
    }
    
    console.log('\n🏁 Testes de correspondência por alias concluídos!');
  } catch (error) {
    console.error('Erro ao executar testes:', error);
  }
}

// Executar os testes
testPropertyAliasMatching();