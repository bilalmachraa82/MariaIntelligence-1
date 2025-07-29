/**
 * Controlador para OCR de documentos
 * Suporta múltiplos fornecedores: OpenRouter (Mistral OCR), RolmOCR e fallback com extrator nativo (pdf-parse)
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AIAdapter, AIServiceType } from '../services/ai-adapter.service';
import { HandwritingDetector } from '../services/handwriting-detector';
import { parseReservationData } from '../parsers/parseReservations';
import { storage } from '../storage';
import { matchPropertyByAlias } from '../utils/matchPropertyByAlias';

// Serviços necessários
const aiAdapter = AIAdapter.getInstance();
const handwritingDetector = new HandwritingDetector();

// Definição de tipos para serviços OCR
type OCRService = 'mistral' | 'openrouter' | 'rolm' | 'native' | 'auto';

// Mapeamento entre tipos OCRService e AIServiceType
const serviceTypeMap: Record<OCRService, AIServiceType> = {
  mistral: AIServiceType.OPENROUTER, // Mistral é fornecido via OpenRouter
  openrouter: AIServiceType.OPENROUTER,
  rolm: AIServiceType.ROLM,
  native: AIServiceType.AUTO, // Usando AUTO como equivalente para o modo nativo
  auto: AIServiceType.AUTO
};

/**
 * Rota unificada para OCR - processa PDFs enviados e extrai dados de reserva
 * Esta rota é a interface principal para upload e processamento de PDFs
 * @param req Requisição Express (contém arquivo PDF via multer)
 * @param res Resposta Express
 */
export async function postOcr(req: Request, res: Response) {
  console.log('📑 Processando OCR [Rota unificada]...');
  
  try {
    // Validar se recebemos um arquivo
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }
    
    // Validar tipo MIME
    if (!req.file.mimetype || req.file.mimetype !== 'application/pdf') {
      // Remover arquivo inválido
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo inválido:', unlinkError);
      }
      
      return res.status(422).json({
        success: false,
        message: 'Tipo de arquivo inválido. Apenas PDFs são aceitos.'
      });
    }
    
    // Ler o arquivo
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = fs.readFileSync(req.file.path);
    } catch (readError) {
      console.error('Erro ao ler arquivo:', readError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao ler o arquivo PDF'
      });
    }
    
    // Determinar o provedor a ser usado (do query parameter)
    let provider = (req.query.provider as string) || 'auto';
    
    // Se for "auto", verificar se o documento contém manuscritos
    // Nova ordem de prioridade: OpenRouter (Mistral) > RolmOCR > Extrator nativo
    if (provider === 'auto') {
      try {
        // Verificar se o documento contém manuscritos
        const handwritingScore = await handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`📝 Pontuação de manuscrito: ${handwritingScore.toFixed(2)}`);
        
        // 1. Se for manuscrito e tivermos HF_TOKEN, usar RolmOCR
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log('🖋️ Detectado manuscrito, usando RolmOCR');
        }
        // 2. Se tivermos OpenRouter, usar como primeira opção para texto normal
        else if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
          console.log('🔄 Usando OpenRouter (Mistral) como provedor primário OCR');
        }
        // 3. Fallback para RolmOCR mesmo para texto normal se OpenRouter não estiver disponível
        else if (process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log('🔄 OpenRouter indisponível, usando RolmOCR como fallback');
        }
        // 4. Último recurso: extrator nativo
        else {
          provider = 'native';
          console.log('📄 Nenhum serviço OCR disponível, usando extrator nativo (pdf-parse)');
        }
      } catch (detectorError) {
        console.error('Erro no detector de manuscritos:', detectorError);
        
        // Em caso de erro, seguir a mesma ordem de prioridade
        if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
          console.log('🔄 Erro no detector, usando OpenRouter (Mistral)');
        } else if (process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log('🔄 Erro no detector, usando RolmOCR');
        } else {
          provider = 'native';
          console.log('📄 Erro no detector, usando extrator nativo como último recurso');
        }
      }
    }
    
    console.log(`🔍 Provedor selecionado: ${provider}`);
    
    // Converter PDF para base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Iniciar métricas
    const startTime = Date.now();
    
    // Extrair texto do PDF usando o provedor selecionado
    let extractedText = '';
    try {
      extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider as any);
      console.log(`✅ Texto extraído com sucesso (${extractedText.length} caracteres)`);
    } catch (extractError) {
      console.error('Erro ao extrair texto do PDF:', extractError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao extrair texto do PDF',
        details: extractError instanceof Error ? extractError.message : 'Erro desconhecido'
      });
    }
    
    // Extrair dados estruturados
    let reservations = [];
    let boxesData = {};
    let missingFields = [];
    
    try {
      // Fazer parsing da resposta do OCR
      const parsedData = await parseReservationData(extractedText);
      reservations = parsedData.reservations || [];
      boxesData = parsedData.boxes || {};
      missingFields = parsedData.missing || [];
      
      // Finalizar métricas
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas
      console.log(`⏱️ OCR processado em ${latencyMs}ms via ${provider}`);
      
      // Processar os dados da propriedade se possível
      if (reservations.length > 0) {
        // Para cada reserva, tentar encontrar a propriedade correspondente
        for (const reservation of reservations) {
          if (reservation.propertyName) {
            try {
              // Buscar todas as propriedades
              const properties = await storage.getProperties();
              
              // Garantir que a propriedade nome é válida
              const propertyName = reservation.propertyName || '';
              const matchedProperty = matchPropertyByAlias(propertyName, properties);
              
              if (matchedProperty) {
                // Propriedade encontrada (seja por nome exato, alias ou correspondência parcial)
                reservation.propertyId = matchedProperty.id;
                
                // Normalizar o nome da propriedade para diagnóstico
                const normalizedPropertyName = propertyName.toLowerCase().trim();
                
                // Registrar como a propriedade foi encontrada (para diagnóstico)
                if (matchedProperty.name.toLowerCase() === normalizedPropertyName) {
                  console.log(`✅ Propriedade encontrada por nome exato: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                } else if (matchedProperty.aliases && Array.isArray(matchedProperty.aliases) && 
                           matchedProperty.aliases.some(alias => alias.toLowerCase() === normalizedPropertyName)) {
                  console.log(`✅ Propriedade encontrada por alias: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                } else {
                  console.log(`✅ Propriedade encontrada por correspondência parcial: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                }
              } else {
                // Se não encontrou correspondência, adicionar aos campos ausentes
                if (!missingFields.includes('propertyId')) {
                  missingFields.push('propertyId');
                }
                console.log(`⚠️ Propriedade não encontrada: ${propertyName}`);
              }
            } catch (propertyError) {
              console.error('Erro ao buscar propriedade:', propertyError);
            }
          } else if (!missingFields.includes('propertyName')) {
            missingFields.push('propertyName');
          }
        }
      }
      
      // Retornar resultado completo
      return res.json({
        success: true,
        provider,
        reservations,
        boxes: boxesData,
        // Adicionar extractedData para compatibilidade com a interface antiga
        extractedData: reservations.length > 0 ? reservations[0] : undefined,
        missing: missingFields,
        rawText: extractedText,
        metrics: {
          latencyMs,
          provider,
          textLength: extractedText.length
        }
      });
    } catch (parseError) {
      console.error('Erro ao extrair dados estruturados:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao extrair dados estruturados',
        rawText: extractedText,
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro no processamento OCR:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no processamento OCR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Processa um arquivo PDF e extrai texto e dados estruturados usando OCR
 * @param req Requisição Express (contém arquivo PDF via multer)
 * @param res Resposta Express
 */
export async function processOCR(req: Request, res: Response) {
  console.log('📑 Iniciando processamento OCR...');
  
  try {
    let pdfBuffer: Buffer;
    let originalFileName: string | undefined;

    // Verificar se o payload é um arquivo enviado (multipart/form-data) ou JSON com base64
    if (req.file) {
      console.log('📄 Processando arquivo enviado via multipart/form-data.');
      originalFileName = req.file.originalname;
      // Validar tipo MIME para arquivo enviado
      if (!req.file.mimetype || req.file.mimetype !== 'application/pdf') {
        try {
          fs.unlinkSync(req.file.path); // Remover arquivo inválido
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo inválido:', unlinkError);
        }
        return res.status(422).json({
          success: false,
          error: 'Tipo de arquivo inválido. Apenas PDFs são aceitos via upload de arquivo.'
        });
      }
      
      try {
        pdfBuffer = fs.readFileSync(req.file.path);
      } catch (readError) {
        console.error('Erro ao ler arquivo enviado:', readError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao ler o arquivo PDF enviado'
        });
      }
      // Remover arquivo temporário após leitura
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo temporário:', unlinkError);
      }

    } else if (req.body && req.body.fileBase64) {
      console.log('📄 Processando arquivo enviado via JSON (base64).');
      originalFileName = req.body.fileName || 'document.pdf'; // Usar nome fornecido ou padrão
      try {
        pdfBuffer = Buffer.from(req.body.fileBase64, 'base64');
      } catch (decodeError) {
        console.error('Erro ao decodificar PDF base64:', decodeError);
        return res.status(400).json({
          success: false,
          error: 'Erro ao decodificar o PDF base64. Verifique se o encoding está correto.'
        });
      }
    } else {
      return res.status(422).json({
        success: false,
        error: 'Nenhum arquivo PDF enviado (nem via upload, nem via JSON com fileBase64).'
      });
    }
    
    // Verificar tamanho do arquivo (aplicável a ambos os payloads)
    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB || '10');
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return res.status(413).json({
        success: false,
        error: `Arquivo PDF muito grande. O tamanho máximo permitido é ${maxSizeMB}MB.`
      });
    }
    
    // Determinar o provedor a ser usado (do query parameter ou body)
    let provider = (req.query.provider as string) || req.body.provider || '';
    
    // Se for "auto" ou não especificado, verificar se o documento contém manuscritos
    // Nova ordem de prioridade: OpenRouter (Mistral) > RolmOCR > Extrator nativo
    if (!provider || provider === 'auto') {
      console.log('🤖 Modo de provedor automático ativado.');
      try {
        // Verificar se o documento contém manuscritos
        const handwritingScore = await handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`📝 Pontuação de manuscrito para "${originalFileName}": ${handwritingScore.toFixed(2)}`);
        
        // 1. Se for manuscrito e tivermos HF_TOKEN, usar RolmOCR
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log(`🖋️ Detectado manuscrito em "${originalFileName}", usando RolmOCR.`);
        }
        // 2. Se tivermos OpenRouter, usar como primeira opção para texto normal
        else if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
          console.log(`🔄 Usando OpenRouter (Mistral) como provedor primário OCR para "${originalFileName}".`);
        }
        // 3. Fallback para RolmOCR mesmo para texto normal se OpenRouter não estiver disponível
        else if (process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log(`🔄 OpenRouter indisponível, usando RolmOCR como fallback para "${originalFileName}".`);
        }
        // 4. Último recurso: extrator nativo
        else {
          provider = 'native';
          console.log('📄 Nenhum serviço OCR disponível, usando extrator nativo (pdf-parse)');
        }
      } catch (detectorError) {
        console.error('Erro no detector de manuscritos:', detectorError);
        
        // Em caso de erro, seguir a mesma ordem de prioridade
        if (process.env.OPENROUTER_API_KEY) {
          provider = 'openrouter';
          console.log('🔄 Erro no detector, usando OpenRouter (Mistral)');
        } else if (process.env.HF_TOKEN) {
          provider = 'rolm';
          console.log('🔄 Erro no detector, usando RolmOCR');
        } else {
          provider = 'native';
          console.log('📄 Erro no detector, usando extrator nativo como último recurso');
        }
      }
    }
    
    console.log(`🔍 Provedor selecionado: ${provider}`);
    
    // Converter PDF para base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Iniciar métricas
    const startTime = Date.now();
    
    // Extrair texto do PDF usando o provedor selecionado
    let extractedText = '';
    try {
      extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider);
      console.log(`✅ Texto extraído com sucesso (${extractedText.length} caracteres)`);
    } catch (extractError) {
      console.error('Erro ao extrair texto do PDF:', extractError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao extrair texto do PDF',
        details: extractError instanceof Error ? extractError.message : 'Erro desconhecido'
      });
    }
    
    // Extrair dados estruturados
    let reservations = [];
    let boxesData = {};
    let missingFields = [];
    
    try {
      // Fazer parsing da resposta do OCR
      const parsedData = await parseReservationData(extractedText);
      reservations = parsedData.reservations || [];
      boxesData = parsedData.boxes || {};
      missingFields = parsedData.missing || [];
      
      // Finalizar métricas
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas
      console.log(`⏱️ OCR processado em ${latencyMs}ms via ${provider}`);
      
      // Processar os dados da propriedade se possível
      if (reservations.length > 0) {
        // Para cada reserva, tentar encontrar a propriedade correspondente
        for (const reservation of reservations) {
          if (reservation.propertyName) {
            try {
              // Buscar todas as propriedades
              const properties = await storage.getProperties();
              
              // Garantir que a propriedade nome é válida
              const propertyName = reservation.propertyName || '';
              const matchedProperty = matchPropertyByAlias(propertyName, properties);
              
              if (matchedProperty) {
                // Propriedade encontrada (seja por nome exato, alias ou correspondência parcial)
                reservation.propertyId = matchedProperty.id;
                
                // Normalizar o nome da propriedade para diagnóstico
                const normalizedPropertyName = propertyName.toLowerCase().trim();
                
                // Registrar como a propriedade foi encontrada (para diagnóstico)
                if (matchedProperty.name.toLowerCase() === normalizedPropertyName) {
                  console.log(`✅ Propriedade encontrada por nome exato: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                } else if (matchedProperty.aliases && Array.isArray(matchedProperty.aliases) && 
                           matchedProperty.aliases.some(alias => alias.toLowerCase() === normalizedPropertyName)) {
                  console.log(`✅ Propriedade encontrada por alias: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                } else {
                  console.log(`✅ Propriedade encontrada por correspondência parcial: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
                }
              } else {
                // Se não encontrou correspondência, adicionar aos campos ausentes
                if (!missingFields.includes('propertyId')) {
                  missingFields.push('propertyId');
                }
                console.log(`⚠️ Propriedade não encontrada: ${propertyName}`);
              }
            } catch (propertyError) {
              console.error('Erro ao buscar propriedade:', propertyError);
            }
          } else if (!missingFields.includes('propertyName')) {
            missingFields.push('propertyName');
          }
        }
      }
      
      // Retornar resultado completo
      return res.json({
        success: true,
        provider,
        reservations,
        boxes: boxesData,
        missing: missingFields,
        rawText: extractedText,
        metrics: {
          latencyMs,
          provider,
          textLength: extractedText.length
        }
      });
    } catch (parseError) {
      console.error('Erro ao extrair dados estruturados:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao extrair dados estruturados',
        details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro no processamento OCR:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno no processamento OCR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Função processWithService foi removida e consolidada na função postOcr
// A função postOcr agora suporta a seleção de serviço via query parameter ?provider=mistral|rolm|native|auto
