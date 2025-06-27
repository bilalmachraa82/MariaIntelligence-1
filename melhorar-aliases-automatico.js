/**
 * MELHORAR ALIASES AUTOMATICAMENTE
 * Adiciona aliases baseado nas análises das atividades órfãs
 */

async function melhorarAliases() {
  console.log('🔧 MELHORANDO ALIASES AUTOMATICAMENTE');
  console.log('====================================');
  
  const aliases = [
    { propertyId: 11, alias: 'Almada 1 Bernardo T3' },
    { propertyId: 11, alias: 'Bernardo T3' },
    { propertyId: 30, alias: 'A203' }, // Assumindo que A203 pode ser Costa blue ou outra
    { propertyId: 20, alias: 'São João Batista T3' }, // Para Nazaré T2 expandir
  ];
  
  console.log(`📝 Adicionando ${aliases.length} novos aliases...\n`);
  
  for (const aliasInfo of aliases) {
    try {
      console.log(`🏠 Adicionando alias "${aliasInfo.alias}" para propriedade ID ${aliasInfo.propertyId}`);
      
      // Simular adição de alias via API
      const response = await fetch(`http://localhost:5000/api/properties/${aliasInfo.propertyId}/aliases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alias: aliasInfo.alias })
      });
      
      if (response.ok) {
        console.log(`   ✅ Alias adicionado com sucesso`);
      } else {
        console.log(`   ⚠️ Erro ao adicionar alias: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  return aliases.length;
}

// Executar melhoria de aliases
melhorarAliases()
  .then(quantidade => {
    console.log(`\n✅ Tentativa de adicionar ${quantidade} aliases concluída`);
  })
  .catch(error => {
    console.error('❌ Erro na melhoria de aliases:', error);
  });