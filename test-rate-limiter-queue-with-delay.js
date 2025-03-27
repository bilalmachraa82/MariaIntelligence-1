/**
 * Teste avançado para verificar o funcionamento da fila do rate limiter com delay explícito
 * Este script faz várias chamadas simultâneas que devem ser distribuídas ao longo do tempo
 */

import fetch from 'node-fetch';

async function testRateLimiterQueueWithDelay() {
  console.log('🧪 Teste de Fila do Rate Limiter com Delay Explícito');
  console.log('--------------------------------------------------');
  
  // Configurações
  const numRequests = 10;  // Número de requisições a serem feitas
  const delayPerRequest = 1000; // 1 segundo de atraso em cada requisição
  const maxParallel = 3;  // Máximo de requisições permitidas em paralelo (simulando rate limit)
  
  // Configurar o rate limiter para aceitar apenas 3 requisições por minuto
  // (Isso é feito através do rate-limiter.service.ts, mas para testes estamos simulando com o delayedRequest)
  
  console.log(`📋 Configurações do teste:`);
  console.log(`• Total de requisições: ${numRequests}`);
  console.log(`• Delay por requisição: ${delayPerRequest}ms`);
  console.log(`• Máximo em paralelo: ${maxParallel}`);
  console.log(`• Tempo mínimo esperado: ${(numRequests / maxParallel) * delayPerRequest}ms`);
  
  console.log('\n🔄 Enviando requisições...');
  
  const startTime = Date.now();
  
  // Fazer requisições para rota com delay
  const requests = Array.from({ length: numRequests }, (_, i) => ({
    id: `req-${i + 1}`,
    delayMs: delayPerRequest
  }));
  
  // Enviar todas as requisições simultaneamente
  const promises = requests.map(async (req) => {
    const startTime = Date.now();
    console.log(`🚀 Enviando requisição ${req.id}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/test/delayed-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });
      
      const result = await response.json();
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`✅ Requisição ${req.id} concluída em ${totalTime}ms`);
      
      return {
        id: req.id,
        requestTime: totalTime,
        actualDelay: result.delayMs,
        timestamp: result.timestamp,
        success: result.success
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${req.id}:`, error.message);
      return {
        id: req.id,
        requestTime: Date.now() - startTime,
        error: error.message,
        success: false
      };
    }
  });
  
  // Aguardar todas as requisições
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  // Ordenar resultados pelo tempo de conclusão
  results.sort((a, b) => a.requestTime - b.requestTime);
  
  // Calcular estatísticas
  const successCount = results.filter(r => r.success).length;
  const avgTime = results.reduce((sum, r) => sum + r.requestTime, 0) / results.length;
  const minTime = Math.min(...results.map(r => r.requestTime));
  const maxTime = Math.max(...results.map(r => r.requestTime));
  
  console.log('\n📊 RESULTADOS:');
  console.log(`• Requisições bem-sucedidas: ${successCount}/${numRequests}`);
  console.log(`• Tempo total de execução: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
  console.log(`• Tempo médio por requisição: ${avgTime.toFixed(2)}ms`);
  console.log(`• Tempo mínimo: ${minTime}ms`);
  console.log(`• Tempo máximo: ${maxTime}ms`);
  
  // Calcular quantas requisições foram realmente executadas em paralelo
  // Se o sistema de filas estiver funcionando, as requisições terão tempos escalonados
  const parallelGroups = [];
  let currentGroup = [results[0]];
  
  for (let i = 1; i < results.length; i++) {
    const current = results[i];
    const prev = results[i-1];
    
    // Se a diferença entre os tempos for pequena, consideramos que executaram em paralelo
    if (current.requestTime - prev.requestTime < 200) {
      currentGroup.push(current);
    } else {
      parallelGroups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  if (currentGroup.length > 0) {
    parallelGroups.push(currentGroup);
  }
  
  console.log(`\n🔀 Análise de paralelismo:`);
  console.log(`• Grupos de execução paralela: ${parallelGroups.length}`);
  
  parallelGroups.forEach((group, i) => {
    console.log(`• Grupo ${i+1}: ${group.length} requisições (${group.map(r => r.id).join(', ')})`);
  });
  
  // Determinar se o teste foi bem sucedido com base no tempo total e paralelismo
  const expectedMinTime = (numRequests / maxParallel) * delayPerRequest;
  const maxParallelObserved = Math.max(...parallelGroups.map(g => g.length));
  
  if (totalTime >= expectedMinTime * 0.9 && maxParallelObserved <= maxParallel * 1.2) {
    console.log('\n✅ TESTE APROVADO: O sistema de fila do rate limiter está funcionando!');
    console.log(`As requisições foram distribuídas adequadamente, respeitando o limite de ${maxParallel} em paralelo.`);
  } else if (maxParallelObserved > maxParallel * 1.2) {
    console.log('\n❌ TESTE FALHOU: Muitas requisições executadas em paralelo.');
    console.log(`Esperado máximo de ${maxParallel}, mas observamos ${maxParallelObserved}.`);
  } else if (totalTime < expectedMinTime * 0.9) {
    console.log('\n❌ TESTE FALHOU: Execução muito rápida.');
    console.log(`Esperado pelo menos ${expectedMinTime}ms, mas concluiu em ${totalTime}ms.`);
  } else {
    console.log('\n⚠️ TESTE INCONCLUSIVO');
    console.log('O comportamento observado não é claro para determinar se o sistema de fila está funcionando corretamente.');
  }
}

testRateLimiterQueueWithDelay().catch(console.error);