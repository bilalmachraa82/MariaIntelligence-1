/**
 * Detector simplificado de manuscritos baseado em heurísticas
 * 
 * Versão compatível com Node.js que não depende de APIs específicas do navegador
 * como DOMMatrix, que não está disponível no ambiente Node.js padrão.
 */

import * as fs from 'fs';
import * as path from 'path';

export class HandwritingDetector {
  /**
   * Analisa um PDF para detectar se contém manuscritos
   * @param pdfBuffer Buffer do PDF a ser analisado
   * @returns Pontuação entre 0 e 1 (0 = sem manuscritos, 1 = provavelmente manuscrito)
   */
  public async analyzePdf(pdfBuffer: Buffer): Promise<number> {
    try {
      // Abordagem alternativa: análise baseada em texto extraído por outros meios
      // Esta versão não usa pdfjs diretamente para evitar problemas de compatibilidade com Node.js
      
      // Extrair conteúdo como texto simples
      // Usaremos uma heurística baseada apenas no conteúdo textual
      const text = pdfBuffer.toString('utf-8', 0, Math.min(10000, pdfBuffer.length));
      
      // Aplicar heurísticas para detectar manuscritos
      const score = this.analyzeTextContent(text);
      
      console.log(`📝 Análise de manuscrito: pontuação ${score.toFixed(2)}`);
      
      return score;
    } catch (error) {
      console.error('❌ Erro ao analisar PDF para detecção de manuscritos:', error);
      return 0; // Por segurança, assumir que não é manuscrito em caso de erro
    }
  }
  
  /**
   * Analisa o conteúdo textual para detectar características de manuscritos
   * @param text Texto extraído do PDF
   * @returns Pontuação entre 0 e 1
   */
  private analyzeTextContent(text: string): number {
    // Implementação simplificada baseada apenas no texto
    
    // 1. Verificar densidade de texto (menos texto = mais chance de ser manuscrito)
    const contentLength = text.length;
    // Para texto extraído, manuscritos tendem a ter menos conteúdo legível
    const densityScore = Math.max(0, Math.min(1, 1 - (contentLength / 5000)));
    
    // 2. Verificar proporção de caracteres não-alfanuméricos (manuscritos tendem a ter mais ruído na extração)
    const nonAlphanumericCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const nonAlphanumericRatio = nonAlphanumericCount / Math.max(1, contentLength);
    const noiseScore = Math.min(1, nonAlphanumericRatio * 5); // Normalizar

    // 3. Verificar padrões de formatação típicos de documentos digitais
    const hasFormattedParagraphs = /\n\s*\n/.test(text);
    const hasNumberedLists = /\n\s*\d+\.\s/.test(text);
    const hasTabularData = /\n\s*\|/.test(text) || /\t/.test(text);
    const formattingScore = (hasFormattedParagraphs || hasNumberedLists || hasTabularData) ? 0 : 0.5;
    
    // 4. Verificar caracteres típicos de documentos digitalizados mas raros em manuscritos
    const digitizedPatterns = /[©®™§¶†‡]/g;
    const hasDigitizedPatterns = digitizedPatterns.test(text) ? 0 : 0.3;
    
    // 5. Análise estatística de comprimento de palavras (manuscritos tendem a ter mais variação)
    const words = text.match(/\b\w+\b/g) || [];
    const wordLengths = words.map(w => w.length);
    const averageWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, wordLengths.length);
    
    // Calcular variância nos comprimentos das palavras
    let variance = 0;
    if (wordLengths.length > 0) {
      variance = wordLengths.reduce((sum, len) => sum + Math.pow(len - averageWordLength, 2), 0) / wordLengths.length;
    }
    // Manuscritos tendem a ter mais variação na extração de texto
    const varianceScore = Math.min(1, variance / 10);
    
    // Calcular pontuação final (ponderada)
    const finalScore = (
      (densityScore * 0.3) + 
      (noiseScore * 0.2) + 
      (formattingScore * 0.2) + 
      (hasDigitizedPatterns * 0.1) + 
      (varianceScore * 0.2)
    );
    
    return finalScore;
  }
}

export default HandwritingDetector;