/**
 * Script para forçar a desabilitação de todos os dados de demonstração
 * Este script modifica o objeto XMLHttpRequest nativo para adicionar parâmetros
 * que sinalizam que dados de demonstração devem ser removidos em todas as requisições
 */

/**
 * Instala um interceptor de requisições que adiciona parâmetros para remover dados demo
 * em todas as requisições API. Esta função modifica o objeto XMLHttpRequest para
 * adicionar parâmetros de query que sinalizam ao backend que os dados de demo
 * devem ser removidos ou filtrados.
 * 
 * @param {boolean} forceCleanMode - Se verdadeiro, adiciona parâmetro para limpeza forçada
 * @returns {boolean} - Verdadeiro se o interceptor foi instalado com sucesso
 */
export function installDemoDataRemover(forceCleanMode: boolean = false) {
  console.log(`Instalando interceptor avançado de requisições para remover dados demo${forceCleanMode ? ' (MODO FORÇADO)' : ''}...`);
  
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
        // Adiciona parâmetros base para remoção de dados demo
        const separator = urlString.includes('?') ? '&' : '?';
        let params = `demoDataRemoved=true&hideDemoTasks=true`;
        
        // Adiciona parâmetro de modo forçado se solicitado
        if (forceCleanMode) {
          params += `&forceCleanMode=true`;
        }
        
        urlString = `${urlString}${separator}${params}`;
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
    
    // Adiciona flag de forceCleanMode ao localStorage se necessário
    if (forceCleanMode) {
      localStorage.setItem('forceCleanMode', 'true');
    }
    
    console.log('✅ Interceptor de requisições avançado instalado com sucesso!');
    console.log(`✅ Parâmetros adicionados a todas as requisições API: demoDataRemoved=true, hideDemoTasks=true${forceCleanMode ? ', forceCleanMode=true' : ''}`);
    console.log('✅ Flags no localStorage configuradas para remover dados demo');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao instalar interceptor de requisições:', error);
    return false;
  }
}

/**
 * Verifica se os dados de demonstração estão configurados para serem removidos
 * baseado nas flags armazenadas no localStorage
 * 
 * @param {boolean} checkForceMode - Se verdadeiro, também verifica o modo forçado
 * @returns {boolean} - Verdadeiro se os dados demo estão configurados para serem removidos
 */
export function isDemoDataRemoved(checkForceMode: boolean = false) {
  const basicCheck = 
    localStorage.getItem('demoDataRemoved') === 'true' ||
    localStorage.getItem('hideDemoTasks') === 'true' ||
    localStorage.getItem('showDemoDataInDashboard') === 'false';
  
  if (checkForceMode) {
    return basicCheck && localStorage.getItem('forceCleanMode') === 'true';
  }
  
  return basicCheck;
}

/**
 * Verifica se o modo forçado de limpeza está ativo
 * 
 * @returns {boolean} - Verdadeiro se o modo forçado está ativo
 */
export function isForceCleanMode() {
  return localStorage.getItem('forceCleanMode') === 'true';
}