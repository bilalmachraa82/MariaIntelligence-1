// Script de teste de granularidade
// Este script simula a lógica do servidor para determinar a granularidade
// com base na diferença de dias entre datas.

// Função para determinar a granularidade
function determineGranularity(startDate, endDate) {
  // Calcular a diferença em dias entre as datas
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const dateDiffTime = endDateObj.getTime() - startDateObj.getTime();
  const dateDiffDays = Math.ceil(dateDiffTime / (1000 * 3600 * 24));
  
  // Sempre usar granularidade mensal conforme padronização
  let granularity = 'month';
  
  // Registrar o período para fins de teste
  console.log(`Período de ${dateDiffDays} dias - granularidade padronizada para mensal`);
  
  return { dateDiffDays, granularity };
}

// Função para testar a granularidade com diferentes intervalos de data
function testGranularity() {
  console.log("===== INICIANDO TESTES DE GRANULARIDADE =====");
  
  // Array de testes
  const tests = [
    {
      name: "Período curto (30 dias)",
      startDate: "2025-02-15",
      endDate: "2025-03-15",
      expectedGranularity: "month" // Agora sempre esperamos mensal
    },
    {
      name: "Período médio (60 dias)",
      startDate: "2025-01-15", 
      endDate: "2025-03-15",
      expectedGranularity: "month" // Agora sempre esperamos mensal
    },
    {
      name: "Período longo (6 meses)",
      startDate: "2024-09-15",
      endDate: "2025-03-15", 
      expectedGranularity: "month"
    },
    {
      name: "Período muito longo (1 ano)",
      startDate: "2024-03-15",
      endDate: "2025-03-15",
      expectedGranularity: "month"
    }
  ];
  
  // Executar cada teste
  tests.forEach(test => {
    console.log(`\n----- TESTE: ${test.name} -----`);
    console.log(`Período: ${test.startDate} até ${test.endDate}`);
    console.log(`Granularidade esperada: ${test.expectedGranularity}`);
    
    // Calcular a granularidade com nossa função
    const { dateDiffDays, granularity } = determineGranularity(test.startDate, test.endDate);
    
    console.log(`Diferença de dias: ${dateDiffDays}`);
    console.log(`Granularidade calculada: ${granularity}`);
    
    // Verificar se passou no teste
    const passed = granularity === test.expectedGranularity;
    console.log(`Resultado: ${passed ? 'PASSOU ✅' : 'FALHOU ❌'}`);
  });
  
  console.log("\n===== TESTES DE GRANULARIDADE CONCLUÍDOS =====");
}

// Executar os testes
testGranularity();