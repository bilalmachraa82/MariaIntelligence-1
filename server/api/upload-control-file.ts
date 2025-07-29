/**
 * API para processamento de arquivos de controle (como "Controlo_Aroeira I.pdf")
 * Permite extrair reservas de PDFs e adicioná-las ao sistema
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { processControlFile, createReservationsFromControlFile } from '../services/control-file-processor';
import { controlFileValidator } from '../services/control-file-validator';

// Configurar o multer para armazenar arquivos temporariamente
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

const router = express.Router();

// Endpoint para upload e processamento de arquivos de controle
router.post('/upload-control-file', upload.single('pdf'), async (req, res) => {
  try {
    console.log('[API] Recebida solicitação para processar arquivo de controle');
    
    // Verificar se recebemos um arquivo
    if (!req.file) {
      console.error('[API] Nenhum arquivo enviado');
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo enviado' 
      });
    }

    const filePath = req.file.path;
    console.log(`[API] Arquivo recebido: ${filePath}`);

    // Verificar se é um PDF
    if (!req.file.mimetype || !req.file.mimetype.includes('pdf')) {
      // Deletar o arquivo temporário
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false, 
        error: 'O arquivo deve ser um PDF' 
      });
    }

    // Processar o arquivo de controle
    const controlResult = await processControlFile(filePath);

    // Se não for um arquivo de controle, informar ao usuário
    if (!controlResult.isControlFile) {
      // Deletar o arquivo temporário
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false, 
        error: 'O arquivo não parece ser um arquivo de controle válido' 
      });
    }

    // Validar as reservas encontradas
    const validationResults = await controlFileValidator.validateReservations(
      controlResult.reservations.map(r => ({
        ...r,
        // Corrigido: usar o ID da propriedade identificada
        propertyId: Number(r.propertyId || controlResult.propertyId) || 0
      }))
    );

    // Gerar resumo da validação
    const validationSummary = controlFileValidator.generateSummary(validationResults);
    
    // Filtrar apenas reservas válidas que não são duplicatas
    const validReservations = validationResults
      .filter(result => result.isValid && !result.isDuplicate)
      .map(result => result.reservation);
    
    // Adicionar as reservas válidas ao sistema
    let createdReservations = [];
    let errorMessage = '';
    
    try {
      if (validReservations.length > 0) {
        // Criar uma cópia do resultado com apenas as reservas válidas
        const validControlResult = {
          ...controlResult,
          reservations: validReservations
        };
        
        createdReservations = await createReservationsFromControlFile(validControlResult);
      }
    } catch (error) {
      console.error('[API] Erro ao criar reservas:', error);
      errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar reservas';
    }
    
    // Formatar os resultados para resposta detalhada
    const formattedResults = {
      valid: validationResults
        .filter(r => r.isValid && !r.isDuplicate)
        .map(r => ({
          guestName: r.reservation.guestName,
          checkInDate: controlFileValidator.formatDateForDisplay(r.reservation.checkInDate),
          checkOutDate: controlFileValidator.formatDateForDisplay(r.reservation.checkOutDate),
          numGuests: r.reservation.numGuests,
          totalAmount: r.reservation.totalAmount,
          platform: r.reservation.platform,
          added: true
        })),
      
      duplicates: validationResults
        .filter(r => r.isDuplicate)
        .map(r => ({
          guestName: r.reservation.guestName,
          checkInDate: controlFileValidator.formatDateForDisplay(r.reservation.checkInDate),
          checkOutDate: controlFileValidator.formatDateForDisplay(r.reservation.checkOutDate),
          numGuests: r.reservation.numGuests,
          totalAmount: r.reservation.totalAmount,
          platform: r.reservation.platform,
          existingReservation: r.existingReservation ? {
            id: r.existingReservation.id,
            guestName: r.existingReservation.guestName,
            checkInDate: controlFileValidator.formatDateForDisplay(r.existingReservation.checkInDate),
            checkOutDate: controlFileValidator.formatDateForDisplay(r.existingReservation.checkOutDate)
          } : null
        })),
      
      invalid: validationResults
        .filter(r => !r.isValid && !r.isDuplicate)
        .map(r => ({
          guestName: r.reservation.guestName || '(sem nome)',
          checkInDate: controlFileValidator.formatDateForDisplay(r.reservation.checkInDate),
          checkOutDate: controlFileValidator.formatDateForDisplay(r.reservation.checkOutDate),
          errors: r.validationErrors
        }))
    };

    // Deletar o arquivo temporário
    fs.unlinkSync(filePath);

    // Retornar resposta com detalhes das reservas
    return res.status(200).json({
      success: true,
      propertyName: controlResult.propertyName,
      totalFound: controlResult.reservations.length,
      summary: validationSummary,
      results: formattedResults,
      created: createdReservations.length,
      error: errorMessage || undefined
    });
  } catch (error) {
    console.error('[API] Erro ao processar arquivo de controle:', error);
    
    // Deletar o arquivo temporário se existir
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignorar erro ao deletar arquivo
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
});

export default router;