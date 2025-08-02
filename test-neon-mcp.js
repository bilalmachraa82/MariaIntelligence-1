// Script para testar conexão Neon via API direta
const NEON_API_KEY = 'napi_wlh2x1ex9lmfubq1cq0fbeapbbvk90e37udlytcc8yx3f6syszqqv92s82b53u54';

async function testNeonConnection() {
  try {
    console.log('🔍 Testando conexão com Neon API...\n');
    
    // Listar projetos
    const response = await fetch('https://console.neon.tech/api/v2/projects', {
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Conexão bem-sucedida!\n`);
    console.log(`📊 Projetos encontrados: ${data.projects?.length || 0}\n`);
    
    if (data.projects && data.projects.length > 0) {
      console.log('📋 Lista de projetos:\n');
      data.projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name} (ID: ${project.id})`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Região: ${project.region_id}`);
        console.log(`   Criado: ${new Date(project.created_at).toLocaleString()}`);
        
        // Mostrar connection string do branch principal
        if (project.databases && project.databases.length > 0) {
          const db = project.databases[0];
          console.log(`   Database: ${db.name}`);
          console.log(`   Connection String: Use 'neon connection-string ${project.id}' para obter\n`);
        }
      });
    } else {
      console.log('⚠️  Nenhum projeto encontrado.\n');
      console.log('💡 Crie um novo projeto em: https://console.neon.tech\n');
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Neon:', error.message);
    console.log('\n💡 Possíveis soluções:');
    console.log('   1. Verifique se a API key está correta');
    console.log('   2. Verifique sua conexão com internet');
    console.log('   3. Tente acessar https://console.neon.tech manualmente');
  }
}

// Executar teste
testNeonConnection();