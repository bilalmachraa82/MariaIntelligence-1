import { Request, Response } from 'express';
import fs from 'fs';
import pdf from 'pdf-parse';
import { GeminiService } from '../services/gemini.service';

/**
 * Controlador OCR corrigido para extrair TODAS as reservas corretamente
 */
export async function processMultipleReservations(req: Request, res: Response) {
  try {
    console.log('🔍 Iniciando processamento OCR para múltiplas reservas');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo foi enviado' 
      });
    }

    // Extrair texto do PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(pdfBuffer);
    const fullText = pdfData.text;
    
    console.log(`📄 Texto extraído: ${fullText.length} caracteres`);
    
    // Usar Gemini com prompt especializado
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

    console.log('🚀 Chamando Gemini com prompt especializado...');
    const geminiResult = await gemini.generateText(prompt);
    console.log('🤖 Resposta Gemini recebida:', geminiResult.substring(0, 300) + '...');
    
    // Parse JSON mais robusto
    let jsonMatch = geminiResult.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = geminiResult.match(/(\{[\s\S]*?\})/);
    }
    
    if (jsonMatch) {
      let jsonStr = jsonMatch[1];
      
      try {
        // Limpar JSON malformado
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1'); // Remove vírgulas trailing
        jsonStr = jsonStr.replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove caracteres não printáveis
        
        const analysisResult = JSON.parse(jsonStr);
        
        if (analysisResult.reservations && Array.isArray(analysisResult.reservations)) {
          console.log(`✅ Gemini extraiu ${analysisResult.reservations.length} reservas`);
          
          const processedReservations = analysisResult.reservations.map(res => ({
            reference: res.reference || '',
            propertyName: res.propertyName || '',
            guestName: res.guestName || '',
            checkInDate: res.checkInDate || '',
            checkOutDate: res.checkOutDate || '',
            totalAmount: res.totalAmount || 0,
            guestCount: res.guestCount || 2,
            status: 'confirmed',
            platform: 'manual',
            notes: 'Extraído via Gemini 2.5 Flash'
          }));
          
          return res.status(200).json({
            success: true,
            provider: 'gemini-2.5-flash',
            reservations: processedReservations,
            extractedData: processedReservations[0] || {},
            rawText: fullText.substring(0, 1000),
            totalFound: processedReservations.length
          });
        }
      } catch (parseError) {
        console.error('❌ Erro no parsing JSON:', parseError);
      }
    }
    
    // Fallback se não conseguir extrair
    return res.status(200).json({
      success: false,
      provider: 'gemini-fallback',
      error: 'Não foi possível extrair reservas estruturadas',
      rawText: fullText.substring(0, 1000)
    });
    
  } catch (error) {
    console.error('❌ Erro no processamento OCR:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno no processamento'
    });
  } finally {
    // Limpar arquivo temporário
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Erro ao limpar arquivo temporário:', cleanupError);
      }
    }
  }
}