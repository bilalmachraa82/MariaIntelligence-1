/**
 * Script para forçar a desabilitação de todos os dados de demonstração
 * Este script modifica o objeto XMLHttpRequest nativo para adicionar parâmetros
 * que sinalizam que dados de demonstração devem ser removidos em todas as requisições
 */

export function installDemoDataRemover() {
  console.log('Instalando interceptor avançado de requisições para remover dados demo...');
  
  try {
    // Guarda referência original
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    
    // Substitui o método open para adicionar parâmetros de query
    window.XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string | URL, 
      async: boolean = true, 
      username?: string | null, 
      password?: string | null
    ) {
      // Converte URL para string se não for
      let urlString = typeof url === 'string' ? url : url.toString();
      
      // Verifica se é uma requisição para API
      if (urlString.includes('/api/')) {
        // Adiciona parâmetros para remoção completa de dados demo
        const separator = urlString.includes('?') ? '&' : '?';
        urlString = `${urlString}${separator}demoDataRemoved=true&hideDemoTasks=true&forceCleanMode=true`;
        console.log(`Requisição modificada para remoção demo: ${urlString}`);
      }
      
      // Chama o método original com URL modificada e parâmetros corretos
      return originalXHROpen.call(
        this, 
        method, 
        urlString, 
        async, 
        username || null, 
        password || null
      );
    };
    
    // Adiciona entrada ao localStorage para garantir que o cliente também respeita
    localStorage.setItem('demoDataRemoved', 'true');
    localStorage.setItem('hideDemoTasks', 'true');
    localStorage.setItem('showDemoDataInDashboard', 'false');
    
    console.log('✅ Interceptor de requisições avançado instalado com sucesso!');
    console.log('✅ Parâmetros adicionados a todas as requisições API: demoDataRemoved=true, hideDemoTasks=true, forceCleanMode=true');
    console.log('✅ Flags no localStorage configuradas para remover dados demo');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao instalar interceptor de requisições:', error);
    return false;
  }
}

export function isDemoDataRemoved() {
  return localStorage.getItem('demoDataRemoved') === 'true' ||
         localStorage.getItem('hideDemoTasks') === 'true' ||
         localStorage.getItem('showDemoDataInDashboard') === 'false';
}