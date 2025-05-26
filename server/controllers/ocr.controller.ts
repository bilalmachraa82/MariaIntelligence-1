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
import pdf from 'pdf-parse';
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

    // ✅ DETECÇÃO PRÉVIA DE ARQUIVOS DE CONTROLE PARA MÚLTIPLAS RESERVAS
    console.log('🔍 Verificando se é arquivo de controle...');
    const initialBuffer = fs.readFileSync(req.file.path);
    const quickCheck = await pdf(initialBuffer);
    const textContent = quickCheck.text.toLowerCase();
    
    // Detectar múltiplas reservas por padrões no texto
    const hasMultipleReservations = textContent.includes('entradas') ||
                                   textContent.includes('saídas') ||
                                   textContent.includes('controlo') ||
                                   textContent.includes('aroeira') ||
                                   // Padrões de reservas múltiplas
                                   (textContent.match(/check[\s-]*in/gi) && textContent.match(/check[\s-]*out/gi)) ||
                                   // Múltiplas datas de reserva
                                   (textContent.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/g) || []).length >= 4 ||
                                   // Múltiplos códigos de referência
                                   (textContent.match(/[a-z]\d+[-]\d+/gi) || []).length >= 2 ||
                                   // Padrões tabulares
                                   textContent.includes('referência') && textContent.includes('alojamento') ||
                                   // Múltiplos telefones
                                   (textContent.match(/\+\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\s?\d{2}/g) || []).length >= 2;
    
    console.log(`🔍 Análise de múltiplas reservas: ${hasMultipleReservations}`);
    console.log(`📊 Texto analisado (primeiros 500 chars): ${textContent.substring(0, 500)}`);
    
    const isControlFile = hasMultipleReservations;
    
    if (isControlFile) {
      console.log('✅ DOCUMENTO COM MÚLTIPLAS RESERVAS DETECTADO - Forçando Gemini 2.5 Flash');
      
      try {
        // Extrair texto completo primeiro
        const pdfBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdf(pdfBuffer);
        const fullText = pdfData.text;
        
        console.log(`📄 Texto extraído: ${fullText.length} caracteres`);
        
        // Usar Gemini diretamente com prompt especializado
        const { GeminiService } = await import('../services/gemini.service');
        const gemini = new GeminiService();
        
        const prompt = `Você é um especialista em extração de dados de documentos de hospedagem.

ANALISE este documento e extraia TODAS as reservas da tabela.

INSTRUÇÕES CRÍTICAS:
1. Este documento contém MÚLTIPLAS RESERVAS em formato de tabela
2. Ignore campos de filtro como "Alojamento: Todos", "Proprietário: Todos" - são filtros de pesquisa
3. Procure por CADA LINHA da tabela de reservas que contenha:
   - Número de referência (ex: 25952514-6423)
   - Nome da propriedade REAL (ex: "São João Batista T3", "Aroeira I", "Aroeira II")
   - Nome do hóspede REAL (ex: "João Silva", "Maria Santos") - NÃO use "Telefone"
   - Datas de check-in e check-out
   - Número de adultos e crianças

CAMPOS OBRIGATÓRIOS por reserva:
- reference: Código/número da reserva
- propertyName: Nome real da propriedade (não "Todos")
- guestName: Nome completo do hóspede (não "Telefone")
- checkInDate: Data formato YYYY-MM-DD
- checkOutDate: Data formato YYYY-MM-DD
- totalAmount: Valor numérico (sem símbolos)
- guestCount: Total de hóspedes

RESPONDA APENAS COM JSON VÁLIDO:
{
  "reservations": [
    {
      "reference": "25952514-6423",
      "propertyName": "São João Batista T3", 
      "guestName": "Ana Silva",
      "checkInDate": "2025-05-25",
      "checkOutDate": "2025-05-27",
      "totalAmount": 150.00,
      "guestCount": 2
    }
  ]
}

DOCUMENTO COMPLETO:
${fullText}`;
{
  "reservations": [
    {
      "reference": "código_referência",
      "propertyName": "nome_propriedade",
      "guestName": "nome_real_hospede",
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD", 
      "adults": 2,
      "children": 0
    }
  ]
}

DOCUMENTO COMPLETO:
${fullText}`;

        console.log('🚀 Tentativa 1/5 - NOVO PROMPT MELHORADO');
        console.log('📋 Usando prompt especializado para múltiplas reservas');
        const geminiResult = await gemini.generateText(prompt);
        console.log('🤖 Resposta Gemini recebida:', geminiResult.substring(0, 300) + '...');
        
        // Parse JSON com melhor tratamento de erros
        let jsonMatch = geminiResult.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (!jsonMatch) {
          jsonMatch = geminiResult.match(/\{[\s\S]*\}/);
        }
        
        if (jsonMatch) {
          let jsonStr = jsonMatch[1] || jsonMatch[0];
          
          // Limpar JSON mal formado
          jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1'); // Remove vírgulas extras antes de } ou ]
          jsonStr = jsonStr.replace(/([}\]])(\s*)([{\[])/g, '$1,$2$3'); // Adiciona vírgulas entre objetos
          
          try {
            // Função robusta para corrigir JSON mal formado
            function fixMalformedJson(str) {
              // Remover vírgulas extras antes de } ou ]
              str = str.replace(/,(\s*[}\]])/g, '$1');
              // Adicionar vírgulas entre objetos
              str = str.replace(/}(\s*){/g, '},$1{');
              // Corrigir aspas problemáticas
              str = str.replace(/""([^"]*)""/g, '"$1"');
              // Remover quebras de linha dentro de strings
              str = str.replace(/"([^"]*)\n([^"]*)"/, '"$1 $2"');
              
              try {
                return JSON.parse(str);
              } catch {
                // Extração manual como último recurso
                const reservations = [];
                const guestMatches = str.match(/"guestName"\s*:\s*"([^"]+)"/g);
                const propertyMatches = str.match(/"propertyName"\s*:\s*"([^"]+)"/g);
                const checkinMatches = str.match(/"checkInDate"\s*:\s*"([^"]+)"/g);
                const checkoutMatches = str.match(/"checkOutDate"\s*:\s*"([^"]+)"/g);
                
                if (guestMatches && propertyMatches) {
                  for (let i = 0; i < Math.min(guestMatches.length, propertyMatches.length); i++) {
                    reservations.push({
                      guestName: guestMatches[i].match(/"([^"]+)"/)[1],
                      propertyName: propertyMatches[i].match(/"([^"]+)"/)[1],
                      checkInDate: checkinMatches?.[i]?.match(/"([^"]+)"/)?.[1] || null,
                      checkOutDate: checkoutMatches?.[i]?.match(/"([^"]+)"/)?.[1] || null,
                      totalAmount: 0,
                      guestCount: 1
                    });
                  }
                }
                return { reservations };
              }
            }
            
            const analysisResult = fixMalformedJson(jsonStr);
          
            if (analysisResult.reservations && analysisResult.reservations.length > 0) {
            console.log(`✅ GEMINI SUCESSO: ${analysisResult.reservations.length} reservas encontradas!`);
            
            const processedReservations = analysisResult.reservations.map(res => ({
              ...res,
              guestPhone: res.guestPhone || '',
              guestEmail: res.guestEmail || '',
              numGuests: (res.adults || 0) + (res.children || 0),
              totalAmount: 0,
              platform: 'manual',
              status: 'confirmed',
              notes: 'Extraído via Gemini 2.5 Flash'
            }));
            
            return res.status(200).json({
              success: true,
              provider: 'gemini-2.5-flash',
              reservations: processedReservations,
              extractedData: processedReservations[0] || {},
              missing: ['Telefone', 'Email', 'Valor da reserva'],
              rawText: fullText.substring(0, 1000),
              requiresConfirmation: true
            });
          }
        } catch (parseError) {
          console.error('❌ Erro no parsing JSON:', parseError);
          console.log('🔄 JSON problemático:', jsonStr);
        }
        } else {
          console.log('⚠️ Nenhum JSON encontrado na resposta do Gemini');
        }
        
        console.log('⚠️ Gemini não encontrou reservas, continuando com método padrão');
        
      } catch (geminiError) {
        console.error('❌ Erro Gemini:', geminiError);
      }
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
    // Validar se recebemos um arquivo
    if (!req.file) {
      return res.status(422).json({
        success: false,
        error: 'Nenhum arquivo enviado'
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
        error: 'Tipo de arquivo inválido. Apenas PDFs são aceitos.'
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
        error: 'Erro ao ler o arquivo PDF'
      });
    }
    
    // Verificar tamanho do arquivo
    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB || '10');
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      // Remover arquivo muito grande
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo muito grande:', unlinkError);
      }
      
      return res.status(413).json({
        success: false,
        error: `Arquivo muito grande. O tamanho máximo permitido é ${maxSizeMB}MB.`
      });
    }
    
    // Determinar o provedor a ser usado
    let provider = (req.query.provider as string) || '';
    
    // Se for "auto", verificar se o documento contém manuscritos
    // Nova ordem de prioridade: OpenRouter (Mistral) > RolmOCR > Extrator nativo
    if (!provider || provider === 'auto') {
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

/**
 * Processa um arquivo usando um serviço OCR específico
 * @param req Requisição Express com parâmetro service e arquivo via multer
 * @param res Resposta Express
 */
export async function processWithService(req: Request, res: Response) {
  console.log('📑 Processando OCR com serviço específico...');
  
  try {
    // Verificar os parâmetros
    const serviceParam = req.params.service;
    if (!serviceParam) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro de serviço não especificado'
      });
    }
    
    // Verificar se o serviço é válido
    let serviceType: AIServiceType;
    const service = serviceParam.toLowerCase() as OCRService;
    
    if (service in serviceTypeMap) {
      serviceType = serviceTypeMap[service];
    } else {
      return res.status(400).json({
        success: false,
        error: `Serviço inválido: ${serviceParam}. Opções válidas: mistral, openrouter, rolm, native, auto`
      });
    }
    
    // Validar se recebemos um arquivo
    if (!req.file) {
      return res.status(422).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    
    // Validar tipo MIME
    if (!req.file.mimetype || !req.file.mimetype.startsWith('application/')) {
      // Remover arquivo inválido
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao remover arquivo inválido:', unlinkError);
      }
      
      return res.status(422).json({
        success: false,
        error: 'Tipo de arquivo inválido. Apenas arquivos de documento são aceitos.'
      });
    }
    
    // Ler o arquivo
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(req.file.path);
    } catch (readError) {
      console.error('Erro ao ler arquivo:', readError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao ler o arquivo'
      });
    }
    
    // Converter para base64
    const fileBase64 = fileBuffer.toString('base64');
    
    // Iniciar métricas
    const startTime = Date.now();
    
    // Extrair texto usando o serviço especificado
    let extractedText = '';
    try {
      extractedText = await aiAdapter.extractTextFromPDF(fileBase64, serviceType);
      console.log(`✅ Texto extraído com sucesso (${extractedText.length} caracteres)`);
    } catch (extractError) {
      console.error(`Erro ao extrair texto via ${service}:`, extractError);
      return res.status(500).json({
        success: false,
        error: `Erro ao extrair texto via ${service}`,
        details: extractError instanceof Error ? extractError.message : 'Erro desconhecido'
      });
    }
    
    // Finalizar métricas
    const endTime = Date.now();
    const latencyMs = endTime - startTime;
    
    // Registrar métricas
    console.log(`⏱️ OCR processado em ${latencyMs}ms via ${service}`);
    
    // Retornar resultado
    return res.json({
      success: true,
      service,
      rawText: extractedText,
      metrics: {
        latencyMs,
        service,
        textLength: extractedText.length
      }
    });
  } catch (error) {
    console.error('Erro no processamento OCR:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno no processamento OCR',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
