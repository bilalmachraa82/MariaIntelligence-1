/**
 * Utilitário para extração de texto de arquivos PDF
 * Utiliza a biblioteca pdf-parse para extrair o texto
 */

import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Extrai texto de um arquivo PDF
 * @param filePath Caminho para o arquivo PDF
 * @returns Texto extraído do PDF
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    console.log(`Extraindo texto do PDF: ${filePath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Ler o arquivo PDF
    const dataBuffer = fs.readFileSync(filePath);
    
    // Configuração para extração de texto
    const options = {
      // Função personalizada para renderizar páginas do PDF
      pagerender: (
        pageData: any
      ) => {
        // Extrair texto da página
        const renderOptions = {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        };
        return pageData.getTextContent(renderOptions)
          .then((textContent: any) => {
            let lastY = -1;
            let text = '';
            
            // Processar cada item de texto na página
            for (const item of textContent.items) {
              // Adicionar quebra de linha se a posição Y mudar significativamente
              if (lastY == -1 || Math.abs(lastY - item.transform[5]) > 5) {
                text += '\n';
              } else if (item.transform[5] === lastY && text.length > 0 && text[text.length - 1] !== ' ') {
                // Adicionar espaço se na mesma linha e não termina com espaço
                text += ' ';
              }
              
              // Adicionar o texto do item
              text += item.str;
              lastY = item.transform[5];
            }
            
            return text;
          });
      }
    };
    
    // Extrair texto do PDF
    const data = await pdf(dataBuffer, options);
    
    // Limpar e formatar o texto extraído
    let extractedText = data.text || '';
    
    // Remover espaços em branco excessivos
    extractedText = extractedText.replace(/\s+/g, ' ').trim();
    
    // Remover caracteres de controle
    extractedText = extractedText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Substituir quebras de linha múltiplas por uma única
    extractedText = extractedText.replace(/\n{2,}/g, '\n');
    
    console.log(`Texto extraído com sucesso (${extractedText.length} caracteres)`);
    
    return extractedText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw new Error(`Erro ao extrair texto do PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}