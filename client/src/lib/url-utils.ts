/**
 * Utilitários para manipulação de URLs - MariaFaz
 * Centraliza funções para normalização e manipulação de URLs
 * Evita problemas com barras duplicadas e formação incorreta de caminhos
 */

/**
 * Normaliza uma URL para evitar barras duplicadas
 * @param url A URL a ser normalizada
 * @returns URL normalizada sem barras duplicadas
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;
  
  // Preserva o protocolo (http:// e https://)
  if (url.includes('://')) {
    // Separa o protocolo do caminho
    const [protocol, path] = url.split('://');
    // Normaliza o caminho (evita barras duplicadas)
    const normalizedPath = normalizePath(path);
    // Reconstrói a URL com o protocolo
    return `${protocol}://${normalizedPath}`;
  }
  
  // Trata URLs relativas (começando com /)
  if (url.startsWith('/')) {
    return '/' + url.split('/').filter(Boolean).join('/');
  }
  
  // Remove barras duplicadas em outros casos (exceto após o protocolo)
  return url.replace(/([^:])\/+/g, '$1/');
}

/**
 * Normaliza um caminho eliminando barras duplicadas
 * @param path O caminho a ser normalizado
 * @returns Caminho normalizado
 */
function normalizePath(path: string): string {
  if (!path) return '';
  
  // Remove barras duplicadas, mantendo sempre apenas uma barra
  return path.replace(/\/+/g, '/');
}

/**
 * Combina caminhos de URL garantindo que exista apenas uma barra entre eles
 * @param base A URL base
 * @param paths Partes adicionais do caminho
 * @returns URL combinada normalizada
 */
export function combineUrls(base: string, ...paths: string[]): string {
  // Remove barras do fim da base, se existirem
  const normalizedBase = base.replace(/\/+$/, '');
  
  // Processa cada caminho adicional
  const processedPaths = paths
    .filter(Boolean) // Remove valores vazios/falsy
    .map(path => path.replace(/^\/+|\/+$/g, '')); // Remove barras do início e fim
  
  // Combina a base com os caminhos, garantindo barras únicas
  const combined = [normalizedBase, ...processedPaths].join('/');
  
  // Retorna URL normalizada final
  return normalizeUrl(combined);
}