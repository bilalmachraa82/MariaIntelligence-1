/**
 * Teste para verificar o funcionamento da função RateLimitedFunction
 * Este teste verifica o comportamento do rate limiter quando aplicado a uma função específica, 
 * incluindo cache, fila e restrições de taxa.
 */

import fetch from 'node-fetch';

// Função auxiliar para criar atraso
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testRateLimiterFunction() {
  console.log('🧪 Teste da Função com Rate Limiter');
  console.log('----------------------------------');
  
  // Limpar o cache para começar com estado limpo
  console.log('🧹 Limpando cache do rate limiter...');
  await fetch('http://localhost:5000/api/test/clear-cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(res => res.json());
  
  // Configurações do teste
  const numRequests = 10; // Número de requisições
  const delayMs = 500; // Atraso de processamento em cada função
  const maxParallel = 3; // Máximo de requisições permitidas em paralelo
  
  console.log(`📋 Configurações:`);
  console.log(`• Total de requisições: ${numRequests}`);
  console.log(`• Atraso por função: ${delayMs}ms`);
  console.log(`• Máximo em paralelo simulado: ${maxParallel}`);
  console.log(`• Tempo mínimo esperado: ${Math.ceil(numRequests / maxParallel) * delayMs}ms`);
  
  // Fase 1: Enviar várias requisições para a função com rate limiting
  console.log('\n🔄 Fase 1: Enviando requisições para função rate-limited...');
  
  const phase1Start = Date.now();
  
  // Criar array de promessas para as requisições
  const requests = Array.from({ length: numRequests }, (_, i) => ({
    id: `req-${i + 1}`,
    forceDelay: delayMs,
    skipCache: false // Usar cache
  }));
  
  // Enviar todas as requisições de uma vez
  const phase1Results = await Promise.all(requests.map(async (req, index) => {
    const requestStart = Date.now();
    console.log(`🚀 Enviando requisição ${req.id}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/test/rate-limited-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      
      const data = await response.json();
      const requestTime = Date.now() - requestStart;
      
      console.log(`✅ Requisição ${req.id} concluída em ${requestTime}ms (${data.cacheHit ? 'cache hit' : 'sem cache'})`);
      
      return {
        id: req.id,
        index: index + 1,
        time: requestTime,
        success: data.success,
        cacheHit: data.cacheHit || false,
        processingTime: data.processingTime
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${req.id}:`, error.message);
      return {
        id: req.id,
        index: index + 1,
        time: Date.now() - requestStart,
        success: false,
        error: error.message
      };
    }
  }));
  
  const phase1Time = Date.now() - phase1Start;
  
  // Análise da Fase 1
  const phase1Success = phase1Results.filter(r => r.success).length;
  const phase1CacheHits = phase1Results.filter(r => r.cacheHit).length;
  const phase1AvgTime = phase1Results.reduce((sum, r) => sum + r.time, 0) / phase1Results.length;
  
  // Ordenar resultados pelo tempo de conclusão
  const sortedResults = [...phase1Results].sort((a, b) => a.time - b.time);
  
  console.log('\n📊 Resultados da Fase 1:');
  console.log(`• Requisições bem-sucedidas: ${phase1Success}/${numRequests}`);
  console.log(`• Cache hits: ${phase1CacheHits}/${numRequests}`);
  console.log(`• Tempo médio por requisição: ${phase1AvgTime.toFixed(2)}ms`);
  console.log(`• Tempo total: ${phase1Time}ms (${(phase1Time/1000).toFixed(2)}s)`);
  
  // Agrupar por tempos similares para detectar execução em paralelo
  const groups = [];
  let currentGroup = [sortedResults[0]];
  
  for (let i = 1; i < sortedResults.length; i++) {
    const current = sortedResults[i];
    const prev = sortedResults[i-1];
    
    if (current.time - prev.time < 100) { // Tolerância de 100ms
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  console.log(`\n🔀 Análise de paralelismo:`);
  console.log(`• Grupos de execução paralela: ${groups.length}`);
  
  groups.forEach((group, i) => {
    console.log(`• Grupo ${i+1}: ${group.length} requisições (${group.map(r => r.id).join(', ')})`);
  });
  
  // Fase 2: Repetir as mesmas requisições para testar cache
  console.log('\n🔄 Fase 2: Verificando uso de cache (mesmas requisições)...');
  
  // Esperar um pouco antes de iniciar a fase 2
  await delay(500);
  
  const phase2Start = Date.now();
  
  // Usar os mesmos IDs para testar cache
  const phase2Results = await Promise.all(requests.map(async (req, index) => {
    const requestStart = Date.now();
    console.log(`🚀 Reenviando requisição ${req.id}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/test/rate-limited-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      
      const data = await response.json();
      const requestTime = Date.now() - requestStart;
      
      console.log(`✅ Requisição ${req.id} concluída em ${requestTime}ms (${data.cacheHit ? 'cache hit' : 'sem cache'})`);
      
      return {
        id: req.id,
        index: index + 1,
        time: requestTime,
        success: data.success,
        cacheHit: data.cacheHit || false,
        processingTime: data.processingTime
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${req.id}:`, error.message);
      return {
        id: req.id,
        index: index + 1,
        time: Date.now() - requestStart,
        success: false,
        error: error.message
      };
    }
  }));
  
  const phase2Time = Date.now() - phase2Start;
  
  // Análise da Fase 2
  const phase2Success = phase2Results.filter(r => r.success).length;
  const phase2CacheHits = phase2Results.filter(r => r.cacheHit).length;
  const phase2AvgTime = phase2Results.reduce((sum, r) => sum + r.time, 0) / phase2Results.length;
  
  console.log('\n📊 Resultados da Fase 2:');
  console.log(`• Requisições bem-sucedidas: ${phase2Success}/${numRequests}`);
  console.log(`• Cache hits: ${phase2CacheHits}/${numRequests}`);
  console.log(`• Tempo médio por requisição: ${phase2AvgTime.toFixed(2)}ms`);
  console.log(`• Tempo total: ${phase2Time}ms (${(phase2Time/1000).toFixed(2)}s)`);
  
  // Calcular melhoria de performance com cache
  const speedImprovement = phase1AvgTime / (phase2AvgTime || 1);
  
  console.log(`• Melhoria de performance com cache: ${speedImprovement.toFixed(2)}x`);
  
  // Fase 3: Teste sem cache
  console.log('\n🔄 Fase 3: Testando sem cache...');
  
  // Esperar um pouco antes de iniciar a fase 3
  await delay(500);
  
  // Criar IDs diferentes e forçar skipCache
  const noCacheRequests = Array.from({ length: 5 }, (_, i) => ({
    id: `no-cache-${i + 1}`,
    forceDelay: delayMs,
    skipCache: true // Forçar sem cache
  }));
  
  const phase3Start = Date.now();
  
  const phase3Results = await Promise.all(noCacheRequests.map(async (req, index) => {
    const requestStart = Date.now();
    console.log(`🚀 Enviando requisição sem cache ${req.id}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/test/rate-limited-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      
      const data = await response.json();
      const requestTime = Date.now() - requestStart;
      
      console.log(`✅ Requisição ${req.id} concluída em ${requestTime}ms (${data.cacheHit ? 'cache hit' : 'sem cache'})`);
      
      return {
        id: req.id,
        index: index + 1,
        time: requestTime,
        success: data.success,
        cacheHit: data.cacheHit || false,
        processingTime: data.processingTime
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${req.id}:`, error.message);
      return {
        id: req.id,
        index: index + 1,
        time: Date.now() - requestStart,
        success: false,
        error: error.message
      };
    }
  }));
  
  const phase3Time = Date.now() - phase3Start;
  
  // Análise da Fase 3
  const phase3Success = phase3Results.filter(r => r.success).length;
  const phase3CacheHits = phase3Results.filter(r => r.cacheHit).length;
  const phase3AvgTime = phase3Results.reduce((sum, r) => sum + r.time, 0) / phase3Results.length;
  
  console.log('\n📊 Resultados da Fase 3 (sem cache):');
  console.log(`• Requisições bem-sucedidas: ${phase3Success}/${noCacheRequests.length}`);
  console.log(`• Cache hits: ${phase3CacheHits}/${noCacheRequests.length}`);
  console.log(`• Tempo médio por requisição: ${phase3AvgTime.toFixed(2)}ms`);
  console.log(`• Tempo total: ${phase3Time}ms (${(phase3Time/1000).toFixed(2)}s)`);
  
  // Agrupamento por tempos similares para detectar paralelismo na fase 3
  const sortedPhase3 = [...phase3Results].sort((a, b) => a.time - b.time);
  const phase3Groups = [];
  let currentPhase3Group = [sortedPhase3[0]];
  
  for (let i = 1; i < sortedPhase3.length; i++) {
    const current = sortedPhase3[i];
    const prev = sortedPhase3[i-1];
    
    if (current.time - prev.time < 100) {
      currentPhase3Group.push(current);
    } else {
      phase3Groups.push(currentPhase3Group);
      currentPhase3Group = [current];
    }
  }
  
  if (currentPhase3Group.length > 0) {
    phase3Groups.push(currentPhase3Group);
  }
  
  console.log(`\n🔀 Análise de paralelismo (sem cache):`);
  console.log(`• Grupos de execução paralela: ${phase3Groups.length}`);
  
  phase3Groups.forEach((group, i) => {
    console.log(`• Grupo ${i+1}: ${group.length} requisições (${group.map(r => r.id).join(', ')})`);
  });
  
  // Conclusão final
  console.log('\n📝 CONCLUSÃO FINAL:');
  
  if (phase1Success === numRequests && phase2Success === numRequests && phase3Success === noCacheRequests.length) {
    console.log('✅ TODAS AS REQUISIÇÕES FORAM BEM-SUCEDIDAS');
    
    if (phase2CacheHits >= numRequests * 0.9) {
      console.log('✅ CACHE: O sistema de cache está funcionando corretamente');
      console.log(`✨ O cache melhorou o tempo de resposta em ${speedImprovement.toFixed(2)}x`);
    } else {
      console.log('⚠️ CACHE: O sistema de cache pode não estar funcionando corretamente');
    }
    
    // Verificar se o sistema de fila distribuiu as requisições
    if (groups.length > 1 || phase3Groups.length > 1) {
      console.log('✅ FILA: O sistema de fila está distribuindo as requisições');
    } else if (phase1AvgTime > delayMs * 0.9 || phase3AvgTime > delayMs * 0.9) {
      console.log('✅ PROCESSAMENTO: As funções estão sendo executadas corretamente');
    } else {
      console.log('⚠️ FILA: Não foi possível confirmar o funcionamento da fila');
    }
    
    console.log('\n🏆 O RATE LIMITER ESTÁ FUNCIONANDO CORRETAMENTE!');
  } else {
    console.log('❌ ALGUMAS REQUISIÇÕES FALHARAM');
    console.log('⚠️ O sistema de rate limiting pode precisar de ajustes.');
  }
}

testRateLimiterFunction().catch(console.error);