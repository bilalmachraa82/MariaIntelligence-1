const NEON_API_KEY = 'napi_wlh2x1ex9lmfubq1cq0fbeapbbvk90e37udlytcc8yx3f6syszqqv92s82b53u54';
const PROJECT_ID = 'plain-recipe-77049551'; // mariafaz

async function getNeonDetails() {
  try {
    console.log('🔍 Obtendo detalhes completos do projeto mariafaz...\n');
    
    // 1. Listar endpoints/branches
    const endpointsResponse = await fetch(`https://console.neon.tech/api/v2/projects/${PROJECT_ID}/endpoints`, {
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (endpointsResponse.ok) {
      const endpoints = await endpointsResponse.json();
      console.log('🔌 Endpoints encontrados:', endpoints.endpoints?.length || 0);
      
      if (endpoints.endpoints && endpoints.endpoints.length > 0) {
        const endpoint = endpoints.endpoints[0];
        console.log('\n📊 Endpoint principal:');
        console.log(`   Host: ${endpoint.host}`);
        console.log(`   ID: ${endpoint.id}`);
        console.log(`   Branch: ${endpoint.branch_id}`);
      }
    }

    // 2. Obter roles/users
    const rolesResponse = await fetch(`https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches/br-main/roles`, {
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (rolesResponse.ok) {
      const roles = await rolesResponse.json();
      console.log('\n👤 Roles/Users:');
      if (roles.roles && roles.roles.length > 0) {
        roles.roles.forEach(role => {
          console.log(`   - ${role.name} (created: ${role.created_at})`);
        });
        
        // Construir connection string manualmente
        const role = roles.roles[0];
        const endpoint = endpoints.endpoints[0];
        
        console.log('\n🔗 Connection String (construída):');
        console.log(`\nDATABASE_URL=postgresql://${role.name}:[YOUR-PASSWORD]@${endpoint.host}/neondb?sslmode=require\n`);
        console.log('⚠️  Você precisa resetar a senha no Neon Console para obter a senha correta.');
      }
    }

    // 3. Listar databases
    const dbResponse = await fetch(`https://console.neon.tech/api/v2/projects/${PROJECT_ID}/databases`, {
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (dbResponse.ok) {
      const databases = await dbResponse.json();
      console.log('\n🗄️ Databases:');
      if (databases.databases && databases.databases.length > 0) {
        databases.databases.forEach(db => {
          console.log(`   - ${db.name} (owner: ${db.owner_name}, branch: ${db.branch_id})`);
        });
      }
    }

    console.log('\n✅ Para obter a connection string completa:');
    console.log('1. Acesse: https://console.neon.tech/app/projects/plain-recipe-77049551');
    console.log('2. Clique em "Connection Details"');
    console.log('3. Copie a connection string com senha');
    console.log('4. Cole no Vercel');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\nDetalhes:', error);
  }
}

getNeonDetails();