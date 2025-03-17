/**
 * Script para classificar PDFs entre check-in e check-out
 * Extrai apenas o texto suficiente para identificar o tipo
 */

import fs from 'fs';
import { extractTextWithPdfParse } from './server/services/pdf-extract';

interface PdfInfo {
  path: string;
  type: 'check-in' | 'check-out' | 'unknown';
  text: string;
}

async function classifyPdf(pdfPath: string): Promise<PdfInfo> {
  console.log(`\nClassificando PDF: ${pdfPath}`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(pdfPath)) {
      console.error(`Arquivo não encontrado: ${pdfPath}`);
      return { 
        path: pdfPath,
        type: 'unknown',
        text: ''
      };
    }
    
    // Ler arquivo
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`PDF carregado (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // Extrair texto usando pdf-parse
    const extractedText = await extractTextWithPdfParse(pdfBuffer);
    
    // Normalizar texto para comparação
    const normalizedText = extractedText.toLowerCase();
    
    // Análise do nome do arquivo para determinar o tipo de documento
    const filename = pdfPath.toLowerCase();
    let docType: 'check-in' | 'check-out' | 'unknown' = 'unknown';
    
    // Determinar pelo nome do arquivo
    if (filename.includes('check-in') || filename.includes('checkin')) {
      docType = 'check-in';
    } else if (filename.includes('check-out') || filename.includes('checkout') || 
               filename.includes('check-outs') || filename.includes('checkouts')) {
      docType = 'check-out';
    }
    
    // Se não conseguimos determinar pelo nome, vamos analisar o conteúdo
    if (docType === 'unknown') {
      // Contagem de ocorrências de palavras-chave específicas
      const checkInCount = (normalizedText.match(/check-in|checkin|check in/g) || []).length;
      const checkOutCount = (normalizedText.match(/check-out|checkout|check out/g) || []).length;
      
      if (checkInCount > checkOutCount) {
        docType = 'check-in';
      } else if (checkOutCount > checkInCount) {
        docType = 'check-out';
      } else {
        // Se as contagens forem iguais, verificamos o contexto
        // Verificar datas específicas ou outros indicadores
        if (normalizedText.includes('departure') || normalizedText.includes('saída') || 
            normalizedText.includes('despedida')) {
          docType = 'check-out';
        } else if (normalizedText.includes('arrival') || normalizedText.includes('chegada') || 
                  normalizedText.includes('boas-vindas')) {
          docType = 'check-in';
        }
      }
    }
    
    // Se ainda não conseguimos determinar, apenas pelo nome do arquivo
    if (docType === 'unknown') {
      if (pdfPath.includes('Check-in')) {
        docType = 'check-in';
      } else if (pdfPath.includes('Check-out')) {
        docType = 'check-out';
      }
    }
    
    // Resultados da classificação
    console.log(`Tipo de documento: ${docType}`);
    
    // Exibir trecho do texto para verificação e números de linha
    console.log(`Texto total: ${extractedText.length} caracteres`);
    const lines = extractedText.split('\n').filter(line => line.trim() !== '');
    console.log(`Total de linhas: ${lines.length}`);
    
    // Mostrar as primeiras e últimas linhas não vazias para comparação
    console.log('Primeiras 5 linhas não vazias:');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`${i+1}. ${lines[i].trim()}`);
    }
    
    // Mostrar algumas linhas do meio para comparação
    const mid = Math.floor(lines.length / 2);
    console.log('\nAlgumas linhas do meio:');
    for (let i = mid; i < Math.min(mid + 3, lines.length); i++) {
      console.log(`${i+1}. ${lines[i].trim()}`);
    }
    
    // Mostrar as últimas linhas para comparação
    console.log('\nÚltimas 5 linhas não vazias:');
    for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
      console.log(`${i+1}. ${lines[i].trim()}`);
    }
    
    return {
      path: pdfPath,
      type: docType,
      text: extractedText
    };
  } catch (error: any) {
    console.error(`Erro ao processar ${pdfPath}:`, error.message);
    return {
      path: pdfPath,
      type: 'unknown',
      text: ''
    };
  }
}

async function main() {
  console.log('Iniciando classificação de PDFs...');
  
  // Lista de PDFs para classificar
  const pdfPaths = [
    './Check-in Maria faz.pdf',
    './Check-outs Maria faz.pdf'
  ];
  
  const pdfInfos: PdfInfo[] = [];
  
  // Classificar cada PDF
  for (const pdfPath of pdfPaths) {
    const info = await classifyPdf(pdfPath);
    pdfInfos.push(info);
  }
  
  // Resumo da classificação
  console.log('\nResumo da classificação:');
  pdfInfos.forEach(info => {
    console.log(`- ${info.path}: ${info.type}`);
  });
  
  // Verificar se encontramos um par check-in/check-out
  const checkIn = pdfInfos.find(info => info.type === 'check-in');
  const checkOut = pdfInfos.find(info => info.type === 'check-out');
  
  if (checkIn && checkOut) {
    console.log('\nPar completo de check-in/check-out encontrado!');
    console.log(`Check-in: ${checkIn.path}`);
    console.log(`Check-out: ${checkOut.path}`);
  } else {
    console.log('\nPar completo de check-in/check-out não encontrado.');
    console.log('Check-in:', checkIn ? checkIn.path : 'Não encontrado');
    console.log('Check-out:', checkOut ? checkOut.path : 'Não encontrado');
  }
}

// Executar o script
main().catch(err => console.error('Erro:', err instanceof Error ? err.message : String(err)));