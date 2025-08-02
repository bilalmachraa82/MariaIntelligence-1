const NEON_API_KEY = 'napi_wlh2x1ex9lmfubq1cq0fbeapbbvk90e37udlytcc8yx3f6syszqqv92s82b53u54';
const PROJECT_ID = 'plain-recipe-77049551'; // mariafaz

async function getConnectionString() {
  try {
    console.log('🔍 Obtendo connection string do projeto mariafaz...\n');
    
    // Obter detalhes do projeto
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${PROJECT_ID}`, {
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const project = await response.json();
    
    // Obter connection string
    const connectResponse = await fetch(`https://console.neon.tech/api/v2/projects/${PROJECT_ID}/connection_uri`, {
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (connectResponse.ok) {
      const data = await connectResponse.json();
      console.log('✅ Connection String encontrada!\n');
      console.log('📋 Adicione ao seu .env ou Vercel:\n');
      console.log(`DATABASE_URL=${data.uri}\n`);
      
      // Salvar em arquivo para facilitar
      require('fs').writeFileSync('.env.database', `DATABASE_URL=${data.uri}\n`);
      console.log('💾 Salvo em .env.database para facilitar cópia\n');
    }

    // Informações do projeto
    console.log('📊 Detalhes do Projeto:');
    console.log(`   Nome: ${project.project.name}`);
    console.log(`   ID: ${project.project.id}`);
    console.log(`   Região: ${project.project.region_id}`);
    console.log(`   Branch padrão: ${project.project.default_branch_id || 'main'}`);
    
    // Listar databases
    if (project.databases && project.databases.length > 0) {
      console.log('\n🗄️ Databases:');
      project.databases.forEach(db => {
        console.log(`   - ${db.name} (owner: ${db.owner_name})`);
      });
    }

    // Listar branches
    if (project.branches && project.branches.length > 0) {
      console.log('\n🌿 Branches:');
      project.branches.forEach(branch => {
        console.log(`   - ${branch.name} (ID: ${branch.id})`);
      });
    }

    console.log('\n✅ Próximos passos:');
    console.log('1. Copie a DATABASE_URL acima');
    console.log('2. Cole no Vercel → Settings → Environment Variables');
    console.log('3. Faça redeploy');
    console.log('4. Acesse: https://mariafaz.vercel.app/api/setup-db?secret=mariafaz2024setup');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Tente obter manualmente em: https://console.neon.tech');
  }
}

getConnectionString();