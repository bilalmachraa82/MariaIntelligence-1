/**
 * Script para forçar o modo limpo na aplicação
 * Bloqueia completamente a visualização e geração de dados demo
 */

// Exportar função para ser usada no componente principal
export function enforceCleanMode() {
  console.log('🧹 ENFORCING CLEAN MODE - Bloqueando todos os dados demo...');
  
  // Definir flags de localStorage permanentemente para bloquear dados demo
  localStorage.setItem('demoDataRemoved', 'true');
  localStorage.setItem('hideDemoTasks', 'true');
  localStorage.setItem('showDemoDataInDashboard', 'false');
  localStorage.setItem('enforcedCleanMode', 'true');
  localStorage.setItem('enforcedCleanModeAt', new Date().toISOString());
  
  // Interceptar XMLHttpRequest para adicionar parâmetros a todas as requisições
  const originalXHROpen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    // Converter URL para string se não for
    let urlString = typeof url === 'string' ? url : url.toString();
    
    // Verificar se é uma requisição para API
    if (urlString.includes('/api/')) {
      // Adicionar parâmetros para bloquear dados demo
      const separator = urlString.includes('?') ? '&' : '?';
      urlString = `${urlString}${separator}demoDataRemoved=true&hideDemoTasks=true&disableDemoData=true`;
    }
    
    // Chamada do método original com URL modificada
    return originalXHROpen.apply(this, [method, urlString, ...rest]);
  };
  
  // Interceptar fetch para adicionar parâmetros a todas as requisições
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    // Se input for string (URL)
    if (typeof input === 'string' && input.includes('/api/')) {
      const separator = input.includes('?') ? '&' : '?';
      input = `${input}${separator}demoDataRemoved=true&hideDemoTasks=true&disableDemoData=true`;
    }
    // Se input for Request
    else if (input instanceof Request && input.url.includes('/api/')) {
      const url = input.url;
      const separator = url.includes('?') ? '&' : '?';
      const newUrl = `${url}${separator}demoDataRemoved=true&hideDemoTasks=true&disableDemoData=true`;
      
      // Criar nova Request com URL modificada
      input = new Request(newUrl, input);
    }
    
    // Chamar fetch original
    return originalFetch.call(this, input, init);
  };
  
  console.log('🧹 CLEAN MODE ENFORCED - Todos os dados demo estão bloqueados');
  return true;
}