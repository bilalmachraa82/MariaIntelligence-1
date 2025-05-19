/**
 * Módulo para limpeza de arquivos temporários
 * Implementa rotinas de limpeza automática de arquivos de upload
 */

import fs from 'fs';
import path from 'path';

// Definir caminho base para uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Limpa arquivos mais antigos que o período especificado
 * 
 * @param maxAgeHours Idade máxima em horas
 */
export async function cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
  console.log(`Iniciando limpeza de arquivos temporários mais antigos que ${maxAgeHours} horas...`);
  
  try {
    // Verificar se diretório principal existe
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('Diretório de uploads não encontrado, nada a limpar.');
      return;
    }
    
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let filesRemoved = 0;
    
    // Processar cada subdiretório (pdf, images, other)
    const subdirs = ['pdf', 'images', 'other'];
    
    for (const subdir of subdirs) {
      const dirPath = path.join(UPLOADS_DIR, subdir);
      
      // Pular se o subdiretório não existir
      if (!fs.existsSync(dirPath)) {
        continue;
      }
      
      // Ler arquivos no diretório
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        // Verificar se é um arquivo (não diretório) e se é antigo o suficiente
        if (stats.isFile() && now - stats.mtimeMs > maxAgeMs) {
          try {
            fs.unlinkSync(filePath);
            filesRemoved++;
          } catch (err) {
            console.error(`Erro ao remover arquivo ${filePath}:`, err);
          }
        }
      }
    }
    
    console.log(`Limpeza concluída: ${filesRemoved} arquivos temporários removidos.`);
  } catch (err) {
    console.error('Erro na limpeza de arquivos temporários:', err);
  }
}

/**
 * Remove um arquivo específico
 * 
 * @param filePath Caminho para o arquivo
 */
export function removeFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Erro ao remover arquivo ${filePath}:`, err);
  }
}

export default {
  cleanupOldFiles,
  removeFile
};