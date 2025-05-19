/**
 * Serviço para limpeza de arquivos temporários
 * Implementa funções de manutenção de segurança para uploads
 */

import { cleanupOldFiles } from '../middleware/cleanup';

/**
 * Limpa arquivos temporários antigos
 * Remove arquivos de upload com mais de 24 horas
 */
export async function cleanupTempFiles() {
  try {
    console.log('Iniciando limpeza de arquivos temporários...');
    await cleanupOldFiles(24); // Remover arquivos com mais de 24 horas
  } catch (error) {
    console.error('Erro ao limpar arquivos temporários:', error);
  }
}

export default {
  cleanupTempFiles
};