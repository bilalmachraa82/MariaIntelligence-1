/**
 * API de assistente de reservas usando Gemini 2.5 Flash
 * Processa texto de reservas e extrai dados estruturados para salvar no banco de dados
 */

import { Router } from 'express';
import { GeminiService } from '../services/gemini.service';
import { ReservationAssistantService } from '../services/reservation-assistant.service';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Configuração do multer para processamento de arquivos
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Criação do router e inicialização dos serviços
const router = Router();
const geminiService = new GeminiService();
const reservationAssistant = new ReservationAssistantService(geminiService);

/**
 * Rota para processar texto de reserva
 * POST /api/reservation-assistant/process
 */
router.post('/process', async (req, res) => {
  try {
    // Validação do corpo da requisição
    const schema = z.object({
      text: z.string().min(1, "Texto não pode estar vazio")
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: validationResult.error.errors
      });
    }

    const { text } = validationResult.data;
    
    // Verificar se a chave da API Gemini está disponível
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: "Chave da API Gemini não configurada. Configure a chave nas definições."
      });
    }
    
    // Processar o texto com o assistente de reservas
    const result = await reservationAssistant.processReservationText(text);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Erro ao processar texto de reserva:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erro interno do servidor"
    });
  }
});

/**
 * Rota para processar arquivo PDF ou imagem de reserva
 * POST /api/reservation-assistant/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado"
      });
    }
    
    // Verificar se a chave da API Gemini está disponível
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: "Chave da API Gemini não configurada. Configure a chave nas definições."
      });
    }
    
    // Ler o arquivo enviado
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath);
    const fileBase64 = fileData.toString('base64');
    const mimeType = req.file.mimetype;
    
    // Processar o arquivo com o assistente de reservas
    let extractedText = '';
    
    // Extrair texto com base no tipo do arquivo
    if (mimeType.includes('pdf')) {
      extractedText = await geminiService.extractTextFromPDF(fileBase64);
    } else if (mimeType.includes('image')) {
      extractedText = await geminiService.extractTextFromImage(fileBase64, mimeType);
    } else {
      return res.status(400).json({
        success: false,
        message: "Tipo de arquivo não suportado. Envie um PDF ou uma imagem."
      });
    }
    
    // Processar o texto extraído
    const result = await reservationAssistant.processReservationText(extractedText);
    
    // Remover o arquivo temporário
    fs.unlinkSync(filePath);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Erro ao processar arquivo de reserva:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erro interno do servidor"
    });
  }
});

/**
 * Rota para salvar reservas extraídas na base de dados
 * POST /api/reservation-assistant/save
 */
router.post('/save', async (req, res) => {
  try {
    // Validação do corpo da requisição
    const schema = z.object({
      reservations: z.array(z.any()).min(1, "É necessário pelo menos uma reserva para salvar")
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: validationResult.error.errors
      });
    }

    const { reservations } = validationResult.data;
    
    // Salvar as reservas no banco de dados
    const result = await reservationAssistant.saveReservations(reservations);
    
    if (result.success) {
      return res.json({
        success: true,
        message: `${result.savedCount} reserva(s) salva(s) com sucesso`,
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Erro ao salvar ${result.failedCount} reserva(s)`,
        data: result
      });
    }
  } catch (error: any) {
    console.error("Erro ao salvar reservas:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Erro interno do servidor"
    });
  }
});

export default router;