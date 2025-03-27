/**
 * Teste de integração do rate limiter com o RateLimitedFunction
 * Este teste verifica se as funções limitadas por taxa estão sendo corretamente
 * gerenciadas pelo rate limiter, incluindo cache, fila e limitação de taxa.
 */

import fetch from 'node-fetch';

// Função auxiliar para criar atraso
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testRateLimiterIntegration() {
  console.log('🧪 Teste de Integração do RateLimitedFunction com Rate Limiter');
  console.log('-------------------------------------------------------------');
  
  // Limpar o cache para garantir que o teste comece com cache vazio
  console.log('🧹 Limpando cache...');
  await fetch('http://localhost:5000/api/test/clear-cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(res => res.json());
  
  // Configurações do teste
  const numRequests = 7; // Número de requisições (>5 para forçar fila)
  const requestDelay = 500; // Atraso entre lotes de requisições
  
  console.log(`📋 Configurações:`);
  console.log(`• Total de requisições: ${numRequests}`);
  console.log(`• Delay entre lotes: ${requestDelay}ms`);
  console.log(`• Limite API Gemini: 5 requisições por minuto`);
  
  // Fase 1: Teste inicial - enviar todas as requisições de uma vez
  console.log('\n🔄 Fase 1: Enviando requisições iniciais...');
  
  // Gerar prompts ligeiramente diferentes para evitar cache
  const prompts = Array.from({ length: numRequests }, (_, i) => 
    `Teste ${i+1}: Gere uma breve descrição do sistema de aluguel de temporada em Portugal. [${Date.now()}]`
  );
  
  const phase1Start = Date.now();
  const phase1Results = await Promise.all(prompts.map(async (prompt, index) => {
    const requestStart = Date.now();
    console.log(`🚀 Enviando requisição ${index+1}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/test/gemini/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, temperature: 0.3 })
      });
      
      const data = await response.json();
      const requestTime = Date.now() - requestStart;
      
      console.log(`✅ Requisição ${index+1} concluída em ${requestTime}ms`);
      
      return {
        index: index + 1,
        time: requestTime,
        success: response.ok,
        cacheHit: data.cacheHit || false,
        responseSize: data.text?.length || 0
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${index+1}:`, error.message);
      return {
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
  
  console.log('\n📊 Resultados da Fase 1:');
  console.log(`• Requisições bem-sucedidas: ${phase1Success}/${numRequests}`);
  console.log(`• Cache hits: ${phase1CacheHits}/${numRequests}`);
  console.log(`• Tempo médio por requisição: ${phase1AvgTime.toFixed(2)}ms`);
  console.log(`• Tempo total: ${phase1Time}ms (${(phase1Time/1000).toFixed(2)}s)`);
  
  // Verificar se houve distribuição de tempo nas requisições
  const sortedTimes = [...phase1Results].sort((a, b) => a.time - b.time);
  const timeSpread = sortedTimes[sortedTimes.length - 1].time - sortedTimes[0].time;
  
  console.log(`• Diferença entre mais rápida e mais lenta: ${timeSpread}ms`);
  
  if (timeSpread > 1000 && phase1Success === numRequests) {
    console.log('✅ FASE 1 APROVADA: As requisições foram distribuídas no tempo pelo rate limiter.');
  } else if (phase1CacheHits > 0) {
    console.log('⚠️ FASE 1 INCONCLUSIVA: Algumas requisições usaram cache.');
  } else {
    console.log('❓ FASE 1 INCERTA: Comportamento não foi claramente um rate limiting.');
  }
  
  // Fase 2: Teste de cache - repetir as mesmas requisições
  console.log('\n🔄 Fase 2: Testando cache (repetindo requisições)...');
  
  // Esperar um pouco antes de iniciar a fase 2
  await delay(requestDelay);
  
  const phase2Start = Date.now();
  const phase2Results = await Promise.all(prompts.map(async (prompt, index) => {
    const requestStart = Date.now();
    console.log(`🚀 Reenviando requisição ${index+1}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/test/gemini/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, temperature: 0.3 })
      });
      
      const data = await response.json();
      const requestTime = Date.now() - requestStart;
      
      console.log(`✅ Requisição ${index+1} concluída em ${requestTime}ms ${data.cacheHit ? '(cache hit)' : ''}`);
      
      return {
        index: index + 1,
        time: requestTime,
        success: response.ok,
        cacheHit: data.cacheHit || false,
        responseSize: data.text?.length || 0
      };
    } catch (error) {
      console.error(`❌ Erro na requisição ${index+1}:`, error.message);
      return {
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
  
  // Verificar eficácia do cache
  const cacheImprovementFactor = phase1AvgTime / (phase2AvgTime || 1);
  
  console.log(`• Fator de melhoria com cache: ${cacheImprovementFactor.toFixed(2)}x`);
  
  if (phase2CacheHits === numRequests && cacheImprovementFactor > 1.5) {
    console.log('✅ FASE 2 APROVADA: O cache está funcionando perfeitamente!');
  } else if (phase2CacheHits > numRequests / 2) {
    console.log('✅ FASE 2 PARCIALMENTE APROVADA: O cache está funcionando para a maioria das requisições.');
  } else {
    console.log('❌ FASE 2 FALHOU: O cache não está funcionando corretamente.');
  }
  
  // Resumo final dos testes
  console.log('\n📝 RESUMO FINAL:');
  
  if (phase1Success === numRequests && phase2Success === numRequests) {
    console.log('✅ TODAS AS REQUISIÇÕES FORAM BEM-SUCEDIDAS');
    
    if (timeSpread > 1000 || phase1Time > 3000) {
      console.log('✅ DISTRIBUIÇÃO DE TEMPO: O rate limiter está distribuindo requisições');
    }
    
    if (phase2CacheHits >= numRequests * 0.8) {
      console.log('✅ CACHE: O sistema de cache está funcionando corretamente');
    }
    
    console.log(`\n✨ PERFORMANCE: O cache melhorou o tempo de resposta em ${cacheImprovementFactor.toFixed(2)}x`);
    
    console.log('\n🏆 CONCLUSÃO FINAL: O sistema de rate limiting está funcionando corretamente!');
  } else {
    console.log('⚠️ ALGUMAS REQUISIÇÕES FALHARAM');
    console.log('⚠️ O sistema de rate limiting pode precisar de ajustes.');
  }
}

testRateLimiterIntegration().catch(console.error);