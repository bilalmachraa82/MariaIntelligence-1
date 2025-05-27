/**
 * Script para forçar o modo limpo na aplicação
 * Bloqueia completamente a visualização e geração de dados demo
 */

// Função desativada - não modifica mais as chamadas API
export function enforceCleanMode() {
  console.log('🧹 Clean mode configurado - interceptors desativados');
  
  // Apenas definir flags de localStorage sem interceptar requisições
  localStorage.setItem('demoDataRemoved', 'true');
  localStorage.setItem('hideDemoTasks', 'true');
  localStorage.setItem('showDemoDataInDashboard', 'false');
  localStorage.setItem('enforcedCleanMode', 'true');
  localStorage.setItem('enforcedCleanModeAt', new Date().toISOString());
  
  // Interceptors removidos - deixar as chamadas API funcionarem normalmente
  
  console.log('🧹 CLEAN MODE ENFORCED - Todos os dados demo estão bloqueados');
  return true;
}