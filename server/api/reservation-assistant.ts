/**
 * API de assistente de reservas usando Gemini 2.5 Flash
 * Processa texto de reservas e extrai dados estruturados para salvar no banco de dados
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ReservationAssistantService } from '../services/reservation-assistant.service';
import { GeminiService } from '../services/gemini.service';
import { extractTextFromPDF } from '../utils/pdf-parser';

const router = Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Criar diretório de uploads se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Nome do arquivo: timestamp + nome original
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    cb(null, `${baseName}-${timestamp}${extension}`);
  }
});

// Filtro para validar tipos de arquivo
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceitar PDFs e imagens
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Apenas PDFs e imagens são aceitos.'));
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// Inicializar serviços
const geminiService = new GeminiService();
const reservationAssistantService = new ReservationAssistantService(geminiService);

/**
 * Rota para processar texto de reserva
 * POST /api/reservation-assistant/process
 */
router.post('/process', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Texto da reserva é obrigatório"
      });
    }
    
    console.log(`Processando texto de reserva (${text.length} caracteres)...`);
    
    // Processar texto com o assistente de reservas
    const result = await reservationAssistantService.processReservationText(text);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Erro ao processar texto de reserva:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Erro ao processar texto de reserva"
    });
  }
});

/**
 * Rota para processar arquivo PDF ou imagem de reserva
 * POST /api/reservation-assistant/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado"
      });
    }
    
    console.log(`Processando arquivo de reserva: ${file.originalname} (${file.size} bytes)`);
    
    let text = '';
    
    // Extrair texto dependendo do tipo de arquivo
    if (file.mimetype === 'application/pdf') {
      text = await extractTextFromPDF(file.path);
    } else if (file.mimetype.startsWith('image/')) {
      // A extração de texto de imagens seria implementada aqui
      // Usando OCR (Tesseract.js, Google Cloud Vision, etc.)
      return res.status(400).json({
        success: false,
        message: "Processamento de imagens ainda não está implementado"
      });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Não foi possível extrair texto do arquivo enviado"
      });
    }
    
    console.log(`Texto extraído (${text.length} caracteres)`);
    
    // Processar texto com o assistente de reservas
    const result = await reservationAssistantService.processReservationText(text);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Erro ao processar arquivo de reserva:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Erro ao processar arquivo de reserva"
    });
  } finally {
    // Limpar arquivo temporário após processamento
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Erro ao remover arquivo temporário:", err);
      });
    }
  }
});

/**
 * Rota para salvar reservas extraídas na base de dados
 * POST /api/reservation-assistant/save
 */
router.post('/save', async (req, res) => {
  try {
    const { reservations } = req.body;
    
    if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhuma reserva para salvar"
      });
    }
    
    console.log(`Salvando ${reservations.length} reservas...`);
    
    // Salvar reservas no banco de dados
    const result = await reservationAssistantService.saveReservations(reservations);
    
    return res.json({
      success: result.success,
      savedCount: result.savedCount,
      message: result.message,
      errors: result.errors
    });
  } catch (error) {
    console.error("Erro ao salvar reservas:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Erro ao salvar reservas"
    });
  }
});

export default router;