import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const router = Router();

// Configuração do multer para webhook
const webhookUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  }
});

/**
 * Endpoint para processar PDF via webhook n8n
 * Este endpoint simplifica drasticamente o processo atual
 */
router.post('/process-pdf', webhookUpload.single('pdf'), async (req, res) => {
  try {
    console.log('🔗 Processando PDF via webhook n8n...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo PDF enviado'
      });
    }

    // URL do webhook n8n (configurável via environment)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/maria-faz-pdf';
    
    // Preparar dados para envio
    const formData = new FormData();
    formData.append('pdf', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Adicionar metadados
    formData.append('metadata', JSON.stringify({
      originalName: req.file.originalname,
      size: req.file.size,
      uploadTimestamp: new Date().toISOString(),
      source: 'maria-faz-website'
    }));

    console.log(`📤 Enviando para n8n: ${n8nWebhookUrl}`);
    
    // Fazer chamada para n8n com timeout aumentado
    const response = await axios.post(n8nWebhookUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || 'maria-faz-secret'
      },
      timeout: 60000 // 60 segundos timeout
    });

    console.log('✅ Resposta recebida do n8n');
    
    // Processar resposta do n8n
    const n8nResult = response.data;
    
    if (n8nResult.success) {
      return res.json({
        success: true,
        message: 'PDF processado com sucesso via n8n',
        data: {
          reservationsCreated: n8nResult.reservationsCreated || 0,
          reservations: n8nResult.reservations || [],
          processingTime: n8nResult.processingTime,
          extractedText: n8nResult.extractedText,
          aiProvider: n8nResult.aiProvider || 'unknown'
        },
        n8nExecutionId: n8nResult.executionId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Erro no processamento n8n',
        details: n8nResult.error || 'Erro desconhecido',
        n8nExecutionId: n8nResult.executionId
      });
    }

  } catch (error) {
    console.error('❌ Erro na integração com n8n:', error);
    
    // Distinguir entre erro de conectividade e erro de processamento
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Serviço n8n indisponível',
        details: 'Verifique se o n8n está rodando e acessível',
        fallbackSuggestion: 'Use o endpoint /api/ocr como alternativa'
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'Erro na resposta do n8n',
        details: error.response.data,
        statusCode: error.response.status
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * Endpoint para verificar status da integração n8n
 */
router.get('/status', async (req, res) => {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/maria-faz-pdf';
    
    // Fazer um health check simples
    const response = await axios.get(n8nWebhookUrl.replace('/webhook/', '/health/'), {
      timeout: 5000
    });
    
    res.json({
      success: true,
      n8nStatus: 'online',
      webhookUrl: n8nWebhookUrl,
      lastCheck: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({
      success: false,
      n8nStatus: 'offline',
      error: error.message,
      lastCheck: new Date().toISOString()
    });
  }
});

/**
 * Endpoint para configurar webhook n8n
 */
router.post('/configure', async (req, res) => {
  try {
    const { webhookUrl, webhookSecret } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL do webhook é obrigatória'
      });
    }
    
    // Validar URL
    try {
      new URL(webhookUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'URL do webhook inválida'
      });
    }
    
    // Testar conectividade
    const testResponse = await axios.get(webhookUrl.replace('/webhook/', '/health/'), {
      timeout: 5000
    });
    
    // Configurar environment variables (em produção, usar secrets manager)
    process.env.N8N_WEBHOOK_URL = webhookUrl;
    if (webhookSecret) {
      process.env.N8N_WEBHOOK_SECRET = webhookSecret;
    }
    
    res.json({
      success: true,
      message: 'Webhook n8n configurado com sucesso',
      webhookUrl: webhookUrl,
      testResult: testResponse.status === 200
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao configurar webhook',
      details: error.message
    });
  }
});

export default router;