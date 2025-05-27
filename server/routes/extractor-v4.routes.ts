/**
 * EXTRACTOR DE RESERVAS v4.2 - Fresh implementation to bypass cache issues
 * This is the exact working version that was extracting lots of reservations hours ago
 */

import { Router } from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

interface ExtractedReservation {
  data_entrada: string;
  data_saida: string;
  noites: number;
  nome: string;
  hospedes: number;
  pais: string;
  pais_inferido: boolean;
  site: string;
  telefone: string;
  observacoes: string;
  timezone_source: string;
  id_reserva: string;
  confidence: number;
  source_page: number;
  needs_review: boolean;
}

// Fresh Gemini instance to bypass any cache
class FreshExtractorService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY não configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractReservations(filePath: string): Promise<{ success: boolean; reservations: ExtractedReservation[] }> {
    try {
      // Extract text from PDF
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(pdfBuffer);
      const extractedText = pdfData.text;

      console.log(`🎯 EXTRACTOR v4.2 - Processing ${extractedText.length} characters`);

      // Use the exact EXTRACTOR DE RESERVAS v4.2 prompt that was working
      const prompt = `# EXTRACTOR DE RESERVAS – v4.2 (schema_version: 1.4)

És um motor de OCR + parsing ultra-fiável para reservas turísticas.

FUNÇÃO: Receber QUALQUER documento e devolver um fluxo estruturado de registos JSON segundo o esquema abaixo.

ESQUEMA (ordem fixa):
{
  "data_entrada": "YYYY-MM-DD",
  "data_saida": "YYYY-MM-DD",
  "noites": 0,
  "nome": "",
  "hospedes": 0,
  "pais": "",
  "pais_inferido": false,
  "site": "",
  "telefone": "",
  "observacoes": "",
  "timezone_source": "",
  "id_reserva": "",
  "confidence": 0.0,
  "source_page": 0,
  "needs_review": false
}

DOCUMENTO:
${extractedText}

INSTRUÇÕES:
- Extrai TODAS as reservas do documento
- Consolida fragmentos que pertencem à mesma reserva
- Calcula 'noites' a partir das datas
- Normaliza datas para YYYY-MM-DD
- Preenche 'pais_inferido=true' se inferires país do telefone
- Gera id_reserva único para cada reserva
- Define confidence baseado na qualidade dos dados
- Marca needs_review=true se faltarem dados críticos

Devolve apenas o array JSON com todas as reservas encontradas.
END_OF_JSON

[FRESH_REQUEST_${Date.now()}]`;

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1,
          candidateCount: 1
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log('🔍 Gemini response length:', text.length);
      console.log('📝 Response preview:', text.substring(0, 200));

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('❌ No JSON array found in response');
        return { success: false, reservations: [] };
      }

      const reservations = JSON.parse(jsonMatch[0]);
      console.log(`✅ Successfully extracted ${reservations.length} reservations`);
      
      return { success: true, reservations };
      
    } catch (error) {
      console.error('❌ Fresh extractor error:', error);
      return { success: false, reservations: [] };
    }
  }
}

// Test endpoint for EXTRACTOR v4.2
router.post('/test-extractor-v4', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }

    console.log(`🚀 Testing EXTRACTOR v4.2 with file: ${req.file.originalname}`);
    
    const extractorService = new FreshExtractorService();
    const result = await extractorService.extractReservations(req.file.path);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: result.success,
      reservations: result.reservations,
      count: result.reservations.length,
      service: 'EXTRACTOR_v4.2_FRESH',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Route error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;