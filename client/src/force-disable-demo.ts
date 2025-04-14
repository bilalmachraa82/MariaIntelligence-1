/**
 * Script para forçar a desabilitação de todos os dados de demonstração
 * Este script modifica o objeto XMLHttpRequest nativo para adicionar o parâmetro
 * demoDataRemoved=true em todas as requisições
 */

export function installDemoDataRemover() {
  console.log('Instalando interceptor de requisições para remover dados demo...');
  
  // Guarda referência original
  const originalXHROpen = window.XMLHttpRequest.prototype.open;
  
  // Substitui o método open para adicionar parâmetros de query
  window.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    // Converte URL para string se não for
    let urlString = typeof url === 'string' ? url : url.toString();
    
    // Verifica se é uma requisição para API
    if (urlString.includes('/api/')) {
      // Adiciona parâmetro demoDataRemoved=true
      const separator = urlString.includes('?') ? '&' : '?';
      urlString = `${urlString}${separator}demoDataRemoved=true&hideDemoTasks=true`;
      console.log(`Requisição modificada: ${urlString}`);
    }
    
    // Chama o método original com URL modificada
    return originalXHROpen.apply(this, [method, urlString, ...rest]);
  };
  
  // Adiciona entrada ao localStorage para garantir que o cliente também respeita
  localStorage.setItem('demoDataRemoved', 'true');
  localStorage.setItem('hideDemoTasks', 'true');
  localStorage.setItem('showDemoDataInDashboard', 'false');
  
  console.log('Interceptor de requisições instalado com sucesso!');
  console.log('Parâmetros adicionados a todas as requisições API: demoDataRemoved=true&hideDemoTasks=true');
  console.log('Flags no localStorage configuradas para remover dados demo');
  
  return true;
}

export function isDemoDataRemoved() {
  return localStorage.getItem('demoDataRemoved') === 'true' ||
         localStorage.getItem('hideDemoTasks') === 'true' ||
         localStorage.getItem('showDemoDataInDashboard') === 'false';
}