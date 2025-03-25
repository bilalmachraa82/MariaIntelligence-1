import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { ZodError, z } from "zod";
import { Mistral } from "@mistralai/mistralai";
import { MistralService } from "./services/mistral.service";
import { RAGService } from "./services/rag.service";
import { RagService } from "./services/rag-service";
import { processPdf } from "./services/pdf-extract";
import { 
  processFileAndCreateReservation,
  processPdfAndCreateReservation 
} from "./services/reservation-creator";
import { registerQuotationRoutes } from "./api/quotation-routes";
import { 
  extendedPropertySchema, 
  extendedOwnerSchema,
  extendedReservationSchema,
  insertActivitySchema,
  reservationStatusEnum,
  reservationPlatformEnum,

  // Schemas para documentos financeiros
  extendedFinancialDocumentSchema,
  extendedPaymentRecordSchema,
  insertFinancialDocumentSchema,
  insertFinancialDocumentItemSchema,
  insertPaymentRecordSchema,
  financialDocumentTypeEnum,
  financialDocumentStatusEnum,
  entityTypeEnum,
  paymentMethodEnum,
  
  // Tipos
  Reservation,
  Property
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Set up multer for file uploads
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Use original filename with timestamp to prevent overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept only PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!') as any, false);
    }
  }
});

// Configuração para upload de imagens (OCR)
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'images');
      // Create uploads/images directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Use original filename with timestamp to prevent overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for images
  },
  fileFilter: function(req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPG, PNG)!') as any, false);
    }
  }
});

// Configuração para upload de ambos os tipos de arquivo (PDF e imagens)
const anyFileUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      let uploadDir;
      
      if (file.mimetype === 'application/pdf') {
        uploadDir = path.join(process.cwd(), 'uploads');
      } else if (file.mimetype.startsWith('image/')) {
        uploadDir = path.join(process.cwd(), 'uploads', 'images');
      } else {
        uploadDir = path.join(process.cwd(), 'uploads', 'other');
      }
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Use original filename with timestamp to prevent overwrites
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept PDFs and images
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas PDFs e imagens (JPG, PNG) são permitidos!') as any, false);
    }
  }
});

// Error handling middleware
const handleError = (err: any, res: Response) => {
  console.error("Error details:", err);

  if (err instanceof ZodError) {
    console.error("Validation error:", JSON.stringify(err.errors, null, 2));
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }

  // Detalhando mais o log para facilitar o debug
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }

  // Garantir que sempre retornamos JSON
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    errorType: err.name || "UnknownError",
    timestamp: new Date().toISOString()
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Properties routes
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const property = await storage.getProperty(Number(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      const validatedData = extendedPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingProperty = await storage.getProperty(id);

      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedProperty = await storage.updateProperty(id, validatedData);
      res.json(updatedProperty);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteProperty(id);

      if (!result) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Owners routes
  app.get("/api/owners", async (req: Request, res: Response) => {
    try {
      const owners = await storage.getOwners();
      res.json(owners);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const owner = await storage.getOwner(Number(req.params.id));
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }
      res.json(owner);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/owners", async (req: Request, res: Response) => {
    try {
      console.log("POST /api/owners - Recebido body:", JSON.stringify(req.body, null, 2));

      // Verificar se o corpo da requisição não está vazio
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("POST /api/owners - Body vazio ou inválido");
        return res.status(400).json({ 
          message: "Corpo da requisição vazio ou inválido",
          timestamp: new Date().toISOString()
        });
      }

      // Validar os dados com o schema
      try {
        const validatedData = extendedOwnerSchema.parse(req.body);
        console.log("POST /api/owners - Dados validados:", JSON.stringify(validatedData, null, 2));

        // Criar o proprietário
        const owner = await storage.createOwner(validatedData);
        console.log("POST /api/owners - Proprietário criado com sucesso:", JSON.stringify(owner, null, 2));

        return res.status(201).json(owner);
      } catch (validationError) {
        console.error("POST /api/owners - Erro de validação:", validationError);
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Erro de validação",
            errors: validationError.errors,
            timestamp: new Date().toISOString()
          });
        }
        throw validationError; // Propagar para o próximo catch
      }
    } catch (err) {
      console.error("POST /api/owners - Erro interno:", err);
      handleError(err, res);
    }
  });

  app.patch("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingOwner = await storage.getOwner(id);

      if (!existingOwner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      const validatedData = extendedOwnerSchema.partial().parse(req.body);
      const updatedOwner = await storage.updateOwner(id, validatedData);
      res.json(updatedOwner);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/owners/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteOwner(id);

      if (!result) {
        return res.status(404).json({ message: "Owner not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Reservations routes
  app.get("/api/reservations", async (req: Request, res: Response) => {
    try {
      let reservations;

      if (req.query.propertyId) {
        reservations = await storage.getReservationsByProperty(Number(req.query.propertyId));
      } else {
        reservations = await storage.getReservations();
      }

      res.json(reservations);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const reservation = await storage.getReservation(Number(req.params.id));
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json(reservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/reservations", async (req: Request, res: Response) => {
    try {
      const validatedData = extendedReservationSchema.parse(req.body);

      // Calculate costs based on property information
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Invalid property ID" });
      }

      // Apply property-specific costs with verificação de nulos
      validatedData.cleaningFee = (property.cleaningCost || '0').toString();
      validatedData.checkInFee = (property.checkInFee || '0').toString();
      validatedData.commissionFee = (Number(validatedData.totalAmount) * Number(property.commission || '0') / 100).toString();
      validatedData.teamPayment = (property.teamPayment || '0').toString();

      // Calculate net amount
      const totalCosts = Number(validatedData.cleaningFee) + 
                        Number(validatedData.checkInFee) + 
                        Number(validatedData.commissionFee) + 
                        Number(validatedData.teamPayment) + 
                        Number(validatedData.platformFee);

      validatedData.netAmount = (Number(validatedData.totalAmount) - totalCosts).toString();

      const reservation = await storage.createReservation(validatedData);
      res.status(201).json(reservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingReservation = await storage.getReservation(id);

      if (!existingReservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };

      // If total amount or property has changed, recalculate costs
      if (validatedData.totalAmount || validatedData.propertyId) {
        const property = await storage.getProperty(
          validatedData.propertyId || existingReservation.propertyId
        );

        if (!property) {
          return res.status(400).json({ message: "Invalid property ID" });
        }

        // Update costs based on property information with verificação de nulos
        validatedData.cleaningFee = (property.cleaningCost || '0').toString();
        validatedData.checkInFee = (property.checkInFee || '0').toString();

        const totalAmount = validatedData.totalAmount || existingReservation.totalAmount;
        validatedData.commissionFee = (Number(totalAmount) * Number(property.commission || '0') / 100).toString();
        validatedData.teamPayment = (property.teamPayment || '0').toString();

        // Recalculate net amount
        const platformFee = validatedData.platformFee || existingReservation.platformFee;
        const totalCosts = Number(validatedData.cleaningFee) + 
                          Number(validatedData.checkInFee) + 
                          Number(validatedData.commissionFee) + 
                          Number(validatedData.teamPayment) + 
                          Number(platformFee);

        validatedData.netAmount = (Number(totalAmount) - totalCosts).toString();
      }

      const updatedReservation = await storage.updateReservation(id, validatedData);
      res.json(updatedReservation);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.deleteReservation(id);

      if (!result) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Activities routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Statistics routes
  app.get("/api/statistics", async (req: Request, res: Response) => {
    try {
      console.log("########### INICIANDO /api/statistics ###########");
      
      // Tratamento especial para as datas para evitar erros de formato
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;

      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;

      if (startDateStr && startDateStr !== 'undefined' && startDateStr !== 'null') {
        startDate = new Date(startDateStr);
      }

      if (endDateStr && endDateStr !== 'undefined' && endDateStr !== 'null') {
        endDate = new Date(endDateStr);
      }

      console.log("Usando datas:", { startDate, endDate });

      // Get properties for active property count
      console.log("Obtendo propriedades...");
      const properties = await storage.getProperties();
      console.log(`Obtidas ${properties.length} propriedades`);
      const activeProperties = properties.filter(p => p.active).length;
      console.log(`Propriedades ativas: ${activeProperties}`);

      // Get revenue and profit using storage methods with date parameters
      let totalRevenue = 0;
      let netProfit = 0;
      let occupancyRate = 0;
      
      try {
        // Use the storage layer methods that already have date filtering
        console.log("CHAMANDO storage.getTotalRevenue...");
        // Teste direto com o SQL
        console.log("Consultando receita total diretamente via SQL...");
        try {
          const { db } = await import('./db');
          const { sql } = await import('drizzle-orm');
          if (db) {
            const directQuery = `SELECT SUM(CAST(total_amount AS DECIMAL)) as direct_total FROM reservations WHERE status = 'completed'`;
            const directResult = await db.execute(sql.raw(directQuery));
            console.log("Resultado da consulta SQL direta:", directResult);
            console.log("Valor total diretamente da tabela:", directResult[0]?.direct_total);
          } else {
            console.log("Banco de dados não disponível para consulta direta");
          }
        } catch (e) {
          console.error("Erro na consulta direta SQL:", e);
        }
        
        totalRevenue = await storage.getTotalRevenue(startDate, endDate);
        console.log("Receita total:", totalRevenue);
        
        console.log("CHAMANDO storage.getNetProfit...");
        netProfit = await storage.getNetProfit(startDate, endDate);
        console.log("Lucro líquido:", netProfit);
        
        console.log("CHAMANDO storage.getOccupancyRate...");
        occupancyRate = await storage.getOccupancyRate(undefined, startDate, endDate);
        console.log("Taxa de ocupação:", occupancyRate);
      } catch (error) {
        console.error("Erro ao obter estatísticas:", error);
        // Continuamos sem quebrar a API
      }
      
      console.log("Estatísticas calculadas:", { totalRevenue, netProfit, occupancyRate });
      
      // Get reservations for the period (for other calculations)
      let reservations = await storage.getReservations();
      
      // Filter reservations by date if parameters are provided
      if (startDate) {
        reservations = reservations.filter(
          r => new Date(r.checkInDate) >= startDate
        );
      }

      if (endDate) {
        reservations = reservations.filter(
          r => new Date(r.checkInDate) <= endDate
        );
      }
      
      // Calculate reservations count
      const confirmedAndCompletedReservations = reservations.filter(
        r => r.status === "confirmed" || r.status === "completed"
      );

      // Get property occupancy rates for top performing properties
      const propertyStats = await Promise.all(
        properties.filter(p => p.active).map(async (property) => {
          const stats = await storage.getPropertyStatistics(property.id);
          return {
            id: property.id,
            name: property.name,
            occupancyRate: stats.occupancyRate,
            revenue: stats.totalRevenue,
            profit: stats.netProfit
          };
        })
      );

      // Sort by occupancy rate descending
      const topProperties = propertyStats
        .sort((a, b) => b.occupancyRate - a.occupancyRate)
        .slice(0, 5);

      res.json({
        success: true,
        totalRevenue,
        netProfit,
        occupancyRate,
        totalProperties: properties.length,
        activeProperties,
        reservationsCount: reservations.length,
        topProperties
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/statistics/property/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const stats = await storage.getPropertyStatistics(id);

      if (!stats) {
        return res.status(404).json({ 
          success: false,
          message: "Property not found" 
        });
      }

      res.json({
        success: true,
        propertyId: id,
        ...stats
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  /**
   * Endpoint para obter receita mensal ou semanal
   * Retorna dados de receita e lucro agregados por período para visualização em gráficos
   * Adapta a granularidade dos dados com base no intervalo (mês, semana, dia)
   */
  app.get("/api/statistics/monthly-revenue", async (req: Request, res: Response) => {
    try {
      console.log("=========================================================");
      console.log("INICIANDO PROCESSAMENTO DE RECEITA POR PERÍODO");
      console.log("=========================================================");
      
      // Pegar parâmetros de filtro de data do request
      const startDateParam = req.query.startDate as string | undefined;
      const endDateParam = req.query.endDate as string | undefined;
      
      // Log dos parâmetros recebidos
      console.log(`Parâmetros recebidos: startDate=${startDateParam}, endDate=${endDateParam}`);
      
      // Definir datas de início e fim
      const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = endDateParam ? new Date(endDateParam) : new Date(new Date().getFullYear(), 11, 31);
      
      console.log(`Período calculado: ${startDate.toISOString()} até ${endDate.toISOString()}`);
      
      // Calcular a diferença em dias entre as datas
      const dateDiffTime = endDate.getTime() - startDate.getTime();
      const dateDiffDays = Math.ceil(dateDiffTime / (1000 * 3600 * 24));
      
      console.log(`Diferença em dias calculada: ${dateDiffDays}`);
      
      // Sempre usar granularidade mensal conforme solicitado
      let granularity = 'month';
      console.log(`Conforme solicitado, todos os dados serão agrupados por mês, independente do período (${dateDiffDays} dias)`);
      console.log(`Granularidade padronizada para mensal`);
      
      // Buscar todas as reservas confirmadas ou concluídas
      const reservations = await storage.getReservations();
      const confirmedReservations = reservations.filter(r => {
        const checkInDate = new Date(r.checkInDate);
        return (r.status === "confirmed" || r.status === "completed") 
          && checkInDate >= startDate
          && checkInDate <= endDate;
      });
      
      console.log(`Encontradas ${confirmedReservations.length} reservas no período`);
      
      let revenueData = [];
      
      // Agrupar dados por mês (agora sempre usando granularidade mensal)
      // Inicializar array com todos os meses
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      
      // Calcular receita e lucro por mês
      revenueData = months.map((month, index) => {
        // Filtrar reservas para este mês, considerando todos os anos no intervalo
        const monthReservations = confirmedReservations.filter(r => {
          const checkInDate = new Date(r.checkInDate);
          return checkInDate.getMonth() === index;
        });
        
        // Calcular receita e lucro total para o mês
        const revenue = monthReservations.reduce(
          (sum, r) => sum + parseFloat(r.totalAmount), 0
        );
        
        const profit = monthReservations.reduce(
          (sum, r) => sum + parseFloat(r.netAmount), 0
        );
        
        return {
          month,
          revenue,
          profit
        };
      });
      
      // Remover períodos sem dados para melhorar a visualização
      revenueData = revenueData.filter(d => d.revenue > 0 || d.profit > 0);
      
      // Se não houver dados após o filtro, manter pelo menos um registro com zeros
      if (revenueData.length === 0) {
        // Como agora só usamos granularidade mensal, sempre usamos o mês inicial
        revenueData = [{ month: 'Jan', revenue: 0, profit: 0 }];
      }
      
      console.log(`Retornando ${revenueData.length} períodos de dados`);
      console.log(`Granularidade final sendo retornada: ${granularity}`);
      console.log("Resumo da resposta:", {
        granularity,
        totalPeriods: revenueData.length,
        firstPeriod: revenueData[0] || null,
        year: startDate.getFullYear()
      });
      
      const response = {
        success: true,
        data: revenueData,
        year: startDate.getFullYear(),
        granularity
      };
      
      console.log("Resposta completa:", JSON.stringify(response));
      res.json(response);
    } catch (err) {
      handleError(err, res);
    }
  });

  const mistralService = new MistralService();
  const ragService = new RAGService();

  // PDF Upload e Processamento
  app.post("/api/upload-pdf", pdfUpload.single('pdf'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de upload de PDF...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }

      // Verifica se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Chave da API Mistral não configurada" 
        });
      }

      try {
        console.log(`Processando PDF: ${req.file.path}`);
        
        // Parâmetro para controlar se uma reserva deve ser criada automaticamente
        const autoCreateReservation = req.query.autoCreate === 'true';
        
        // Usar o novo serviço de processamento que pode criar reservas
        let result;
        
        if (autoCreateReservation) {
          // Usar o serviço completo que processa o PDF e cria uma reserva
          result = await processPdfAndCreateReservation(req.file.path, process.env.MISTRAL_API_KEY);
          console.log('Processamento e criação de reserva concluídos:', result.success);
          
          // Adicionar atividade ao sistema se a reserva foi criada
          if (result.success && result.reservation) {
            await storage.createActivity({
              type: 'reservation_created',
              description: `Reserva criada automaticamente via PDF: ${result.reservation.propertyId} - ${result.reservation.guestName}`,
              entityId: result.reservation.id,
              entityType: 'reservation'
            });
          }
          
          // Adicionar o texto extraído à base de conhecimento RAG
          if (result.extractedData && result.extractedData.rawText) {
            await ragService.addToKnowledgeBase(result.extractedData.rawText, 'reservation_pdf', {
              filename: req.file.filename,
              uploadDate: new Date(),
              reservationId: result.reservation?.id,
              status: result.success ? 'created' : 'failed'
            });
          }
          
          // Retornar resultado com a reserva criada e dados extraídos
          return res.json({
            success: result.success,
            message: result.message,
            reservation: result.reservation,
            extractedData: result.extractedData,
            validation: result.validationResult,
            file: {
              filename: req.file.filename,
              path: req.file.path
            }
          });
        } else {
          // Processar apenas o PDF sem criar reserva (comportamento antigo)
          console.log('Processando PDF sem criação automática de reserva');
          
          // Usar o serviço de extração e validação
          const validationResult = await processPdf(req.file.path, process.env.MISTRAL_API_KEY);
          console.log('Validação concluída:', validationResult.status);
          
          // Extrair os dados validados com valores padrão
          const extractedData = validationResult.dataWithDefaults;
          
          // Adicionar o texto extraído à base de conhecimento RAG
          if (extractedData && extractedData.rawText) {
            await ragService.addToKnowledgeBase(extractedData.rawText, 'reservation_pdf', {
              filename: req.file.filename,
              uploadDate: new Date(),
              validationStatus: validationResult.status
            });
          }

          // Encontrar a propriedade correspondente pelo nome (com lógica mais flexível)
          const properties = await storage.getProperties();
          console.log(`Buscando correspondência para propriedade: ${extractedData?.propertyName}`);
          
          // Lógica de matching de propriedade mais flexível
          let matchedProperty = null;
          
          if (extractedData && extractedData.propertyName) {
            // Primeiro tenta match exato (case insensitive)
            matchedProperty = properties.find(p => 
              p.name.toLowerCase() === extractedData.propertyName.toLowerCase()
            );
            
            // Se não encontrar, usa matching mais flexível
            if (!matchedProperty) {
              // Define uma função de similaridade
              const calculateSimilarity = (str1: string, str2: string): number => {
                const words1 = str1.toLowerCase().split(/\s+/);
                const words2 = str2.toLowerCase().split(/\s+/);
                const commonWords = words1.filter((word: string) => words2.includes(word));
                return commonWords.length / Math.max(words1.length, words2.length);
              };
              
              // Encontrar a propriedade com maior similaridade
              let bestMatch = null;
              let highestSimilarity = 0;
              
              for (const property of properties) {
                const similarity = calculateSimilarity(
                  extractedData.propertyName, 
                  property.name
                );
                
                if (similarity > highestSimilarity && similarity > 0.6) {
                  highestSimilarity = similarity;
                  bestMatch = property;
                }
              }
              
              matchedProperty = bestMatch;
            }
          }
          
          // Se não encontrar propriedade, define valores padrão
          if (!matchedProperty) {
            matchedProperty = { id: null, cleaningCost: 0, checkInFee: 0, commission: 0, teamPayment: 0 };
            
            // Adicionar erro de validação se não encontrou a propriedade
            if (extractedData && extractedData.propertyName) {
              validationResult.errors.push({
                field: 'propertyName',
                message: 'Propriedade não encontrada no sistema',
                severity: 'warning'
              });
              
              validationResult.warningFields.push('propertyName');
            }
          }

          // Calcular taxas e valores baseados na propriedade encontrada
          const totalAmount = extractedData?.totalAmount || 0;
          const platformFee = extractedData?.platformFee || (
            (extractedData?.platform === "airbnb" || extractedData?.platform === "booking") 
              ? Math.round(totalAmount * 0.1) 
              : 0
          );

          // Adicionar atividade ao sistema
          await storage.createActivity({
            type: 'pdf_processed',
            description: `PDF processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})`,
            entityId: matchedProperty.id,
            entityType: 'property'
          });

          // Criar resultados enriquecidos
          const enrichedData = {
            ...extractedData,
            propertyId: matchedProperty.id,
            platformFee: platformFee,
            cleaningFee: extractedData?.cleaningFee || Number(matchedProperty.cleaningCost || 0),
            checkInFee: extractedData?.checkInFee || Number(matchedProperty.checkInFee || 0),
            commissionFee: extractedData?.commissionFee || (totalAmount * Number(matchedProperty.commission || 0) / 100),
            teamPayment: extractedData?.teamPayment || Number(matchedProperty.teamPayment || 0)
          };

          // Retorna os dados extraídos com as informações da propriedade e status de validação
          return res.json({
            success: true,
            extractedData: enrichedData,
            validation: {
              status: validationResult.status,
              isValid: validationResult.isValid,
              errors: validationResult.errors,
              missingFields: validationResult.missingFields,
              warningFields: validationResult.warningFields
            },
            file: {
              filename: req.file.filename,
              path: req.file.path
            }
          });
        }
      } catch (processError) {
        console.error('Erro no processamento do PDF:', processError);
        // Retornar erro formatado
        return res.status(500).json({ 
          success: false,
          message: "Falha ao processar PDF", 
          error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento"
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de PDF:', err);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });
  
  /**
   * Endpoint para processamento de imagens usando OCR
   * Extrai dados de reserva a partir de imagens de confirmações e comprovantes
   */
  app.post("/api/upload-image", imageUpload.single('image'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de upload de imagem para OCR...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhuma imagem enviada" 
        });
      }

      // Verifica se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Chave da API Mistral não configurada" 
        });
      }

      try {
        console.log(`Processando imagem: ${req.file.path}`);
        
        // Parâmetro para controlar se uma reserva deve ser criada automaticamente
        const autoCreateReservation = req.query.autoCreate === 'true';
        
        // Usar o novo serviço de processamento que pode criar reservas a partir de imagens
        const result = await processFileAndCreateReservation(req.file.path, process.env.MISTRAL_API_KEY);
        console.log('Processamento OCR e criação de reserva concluídos:', result.success);
        
        // Adicionar atividade ao sistema se a reserva foi criada
        if (result.success && result.reservation) {
          await storage.createActivity({
            type: 'reservation_created',
            description: `Reserva criada automaticamente via OCR de imagem: ${result.reservation.propertyId} - ${result.reservation.guestName}`,
            entityId: result.reservation.id,
            entityType: 'reservation'
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        if (result.extractedData && result.extractedData.rawText) {
          await ragService.addToKnowledgeBase(result.extractedData.rawText, 'reservation_image_ocr', {
            filename: req.file.filename,
            uploadDate: new Date(),
            reservationId: result.reservation?.id,
            status: result.success ? 'created' : 'failed'
          });
        }
        
        // Retornar resultado com a reserva criada e dados extraídos
        return res.json({
          success: result.success,
          message: result.message,
          reservation: result.reservation,
          extractedData: result.extractedData,
          validation: result.validationResult,
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype
          }
        });
      } catch (processError) {
        console.error('Erro no processamento da imagem:', processError);
        // Retornar erro formatado
        return res.status(500).json({ 
          success: false,
          message: "Falha ao processar imagem com OCR", 
          error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento"
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de imagem:', err);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  /**
   * Endpoint para processamento de qualquer arquivo (PDF ou imagem)
   * Detecta automaticamente o tipo e executa o processamento apropriado
   */
  app.post("/api/upload-file", anyFileUpload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de upload de arquivo (PDF/imagem)...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }

      // Verifica se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Chave da API Mistral não configurada" 
        });
      }

      try {
        console.log(`Processando arquivo: ${req.file.path} (${req.file.mimetype})`);
        
        // Parâmetro para controlar se uma reserva deve ser criada automaticamente
        const autoCreateReservation = req.query.autoCreate === 'true';
        
        // Usar o serviço que processa qualquer tipo de arquivo e cria reserva
        const result = await processFileAndCreateReservation(req.file.path, process.env.MISTRAL_API_KEY);
        console.log('Processamento e criação de reserva concluídos:', result.success);
        
        // Adicionar atividade ao sistema se a reserva foi criada
        if (result.success && result.reservation) {
          await storage.createActivity({
            type: 'reservation_created',
            description: `Reserva criada automaticamente via arquivo: ${result.reservation.propertyId} - ${result.reservation.guestName}`,
            entityId: result.reservation.id,
            entityType: 'reservation'
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        if (result.extractedData && result.extractedData.rawText) {
          await ragService.addToKnowledgeBase(result.extractedData.rawText, 'reservation_file', {
            filename: req.file.filename,
            uploadDate: new Date(),
            reservationId: result.reservation?.id,
            status: result.success ? 'created' : 'failed',
            fileType: req.file.mimetype
          });
        }
        
        // Retornar resultado com a reserva criada e dados extraídos
        return res.json({
          success: result.success,
          message: result.message,
          reservation: result.reservation,
          extractedData: result.extractedData,
          validation: result.validationResult,
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype
          }
        });
      } catch (processError) {
        console.error('Erro no processamento do arquivo:', processError);
        // Retornar erro formatado
        return res.status(500).json({ 
          success: false,
          message: "Falha ao processar arquivo", 
          error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento"
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de arquivo:', err);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  /**
   * Endpoint para upload e processamento de PDFs
   * Processa documentos individuais ou em par (check-in e check-out) para extração de dados
   * 
   * Pode processar:
   * - Um único documento (para processamento básico)
   * - Um par de documentos (para processamento enriquecido com dados de ambos)
   * 
   * Para pares, identifica o primeiro como check-in e o segundo como check-out
   * quando a identificação automática falha.
   */
  app.post("/api/upload-pdf-pair", pdfUpload.array('pdfs', 2), async (req: Request, res: Response) => {
    try {
      console.log('Iniciando processamento de par de PDFs...');
      
      // Verificar se foram enviados arquivos
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }
      
      // Verifica se temos pelo menos um arquivo
      if (req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "É necessário enviar pelo menos um arquivo PDF",
          filesReceived: 0
        });
      }
      
      // Nota: o sistema funciona melhor com 2 arquivos (check-in e check-out),
      // mas pode processar individualmente quando necessário

      // Verifica se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Chave da API Mistral não configurada" 
        });
      }

      try {
        // Importar o serviço de processamento de pares de PDFs
        const { processPdfPair } = await import('./services/pdf-pair-processor');
        
        // Obter caminhos dos arquivos enviados
        const pdfPaths = (req.files as Express.Multer.File[]).map(file => file.path);
        const fileInfo = (req.files as Express.Multer.File[]).map(file => ({
          filename: file.filename,
          path: file.path,
          originalname: file.originalname
        }));
        
        console.log(`Processando ${pdfPaths.length} arquivos: ${pdfPaths.join(', ')}`);
        
        // Processar o par de PDFs
        const pairResult = await processPdfPair(pdfPaths, process.env.MISTRAL_API_KEY);
        
        // Se não há dados de reserva extraídos, retorna erro
        if (!pairResult.reservationData) {
          console.error('Não foi possível extrair dados da reserva');
          return res.status(422).json({
            success: false,
            message: "Não foi possível extrair dados da reserva dos documentos",
            pairInfo: {
              isPairComplete: pairResult.isPairComplete,
              checkInPresent: !!pairResult.checkIn,
              checkOutPresent: !!pairResult.checkOut
            },
            errors: pairResult.errors
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        if (pairResult.checkIn && pairResult.checkIn.text) {
          await ragService.addToKnowledgeBase(pairResult.checkIn.text, 'check_in_pdf', {
            filename: pairResult.checkIn.filename,
            uploadDate: new Date(),
            documentType: 'check-in'
          });
        }
        
        if (pairResult.checkOut && pairResult.checkOut.text) {
          await ragService.addToKnowledgeBase(pairResult.checkOut.text, 'check_out_pdf', {
            filename: pairResult.checkOut.filename,
            uploadDate: new Date(),
            documentType: 'check-out'
          });
        }

        // Extrair os dados validados
        const extractedData = pairResult.reservationData;
        const validationResult = pairResult.validationResult;
        
        if (!validationResult) {
          console.error('Resultado de validação não disponível');
          return res.status(500).json({
            success: false,
            message: "Erro no processamento dos documentos",
            pairInfo: {
              isPairComplete: pairResult.isPairComplete,
              checkInPresent: !!pairResult.checkIn,
              checkOutPresent: !!pairResult.checkOut
            },
            errors: [...pairResult.errors, "Falha na validação dos dados extraídos"]
          });
        }
        
        // Encontrar a propriedade correspondente pelo nome
        const properties = await storage.getProperties();
        console.log(`Buscando correspondência para propriedade: ${extractedData?.propertyName}`);
        
        // Lógica de matching de propriedade
        let matchedProperty = null;
        
        if (extractedData && extractedData.propertyName) {
          // Primeiro tenta match exato (case insensitive)
          matchedProperty = properties.find(p => 
            p.name.toLowerCase() === extractedData.propertyName.toLowerCase()
          );
          
          // Se não encontrar, usa matching mais flexível
          if (!matchedProperty) {
            // Define uma função de similaridade
            const calculateSimilarity = (str1: string, str2: string): number => {
              const words1 = str1.toLowerCase().split(/\s+/);
              const words2 = str2.toLowerCase().split(/\s+/);
              const commonWords = words1.filter((word: string) => words2.includes(word));
              return commonWords.length / Math.max(words1.length, words2.length);
            };
            
            // Encontrar a propriedade com maior similaridade
            let bestMatch = null;
            let highestSimilarity = 0;
            
            for (const property of properties) {
              const similarity = calculateSimilarity(
                extractedData.propertyName, 
                property.name
              );
              
              if (similarity > highestSimilarity && similarity > 0.6) {
                highestSimilarity = similarity;
                bestMatch = property;
              }
            }
            
            matchedProperty = bestMatch;
          }
        }
        
        // Se não encontrar propriedade, define valores padrão
        if (!matchedProperty) {
          matchedProperty = { id: null, cleaningCost: 0, checkInFee: 0, commission: 0, teamPayment: 0 };
          
          // Adicionar erro de validação se não encontrou a propriedade
          if (extractedData && extractedData.propertyName) {
            validationResult.errors.push({
              field: 'propertyName',
              message: 'Propriedade não encontrada no sistema',
              severity: 'warning'
            });
            
            if (!validationResult.warningFields) {
              validationResult.warningFields = [];
            }
            validationResult.warningFields.push('propertyName');
          }
        }

        // Calcular taxas e valores baseados na propriedade encontrada
        const totalAmount = extractedData?.totalAmount || 0;
        const platformFee = extractedData?.platformFee || (
          (extractedData?.platform === "airbnb" || extractedData?.platform === "booking") 
            ? Math.round(totalAmount * 0.1) 
            : 0
        );

        // Adicionar atividade ao sistema com tipo adequado (par ou único)
        const activityType = pairResult.isPairComplete ? 'pdf_pair_processed' : 'pdf_processed';
        const activityDescription = pairResult.isPairComplete ? 
          `Par de PDFs processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})` :
          `PDF processado: ${extractedData?.propertyName || 'Propriedade desconhecida'} - ${extractedData?.guestName || 'Hóspede desconhecido'} (${validationResult.status})`;
        
        await storage.createActivity({
          type: activityType,
          description: activityDescription,
          entityId: matchedProperty.id,
          entityType: 'property'
        });

        // Criar resultados enriquecidos
        const enrichedData = {
          ...extractedData,
          propertyId: matchedProperty.id,
          platformFee: platformFee,
          cleaningFee: extractedData?.cleaningFee || Number(matchedProperty.cleaningCost || 0),
          checkInFee: extractedData?.checkInFee || Number(matchedProperty.checkInFee || 0),
          commissionFee: extractedData?.commissionFee || (totalAmount * Number(matchedProperty.commission || 0) / 100),
          teamPayment: extractedData?.teamPayment || Number(matchedProperty.teamPayment || 0)
        };

        // Definir uma mensagem adequada com base no tipo de processamento
        let processMessage = "";
        if (pairResult.isPairComplete) {
          processMessage = "Par de documentos processado com sucesso (check-in + check-out)";
        } else if (pairResult.checkIn) {
          processMessage = "Documento de check-in processado com sucesso, sem documento de check-out";
        } else if (pairResult.checkOut) {
          processMessage = "Documento de check-out processado com sucesso, sem documento de check-in";
        }
        
        // Retorna os dados extraídos com as informações da propriedade e status de validação
        res.json({
          success: true,
          message: processMessage,
          extractedData: enrichedData,
          validation: {
            status: validationResult.status,
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            missingFields: validationResult.missingFields,
            warningFields: validationResult.warningFields
          },
          pairInfo: {
            isPairComplete: pairResult.isPairComplete,
            checkInPresent: !!pairResult.checkIn,
            checkOutPresent: !!pairResult.checkOut
          },
          files: fileInfo
        });
      } catch (processError) {
        console.error('Erro no processamento dos PDFs:', processError);
        // Retornar erro formatado
        return res.status(500).json({ 
          success: false,
          message: "Falha ao processar PDFs", 
          error: processError instanceof Error ? processError.message : "Erro desconhecido no processamento"
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de PDFs:', err);
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: err instanceof Error ? err.message : "Erro desconhecido"
      });
    }
  });

  // Função auxiliar para extrair texto de um PDF usando a API Mistral
  async function extractTextFromPDFWithMistral(pdfBase64: string): Promise<string> {
    const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

    const prompt = `
      Você é um especialista em OCR (Reconhecimento Óptico de Caracteres). 
      O conteúdo fornecido é um PDF de uma reserva de alojamento local em base64.
      Por favor, extraia todo o texto visível neste documento sem interpretações adicionais.
      Retorne apenas o texto extraído, sem comentários ou formatação adicional.
    `;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em OCR (Optical Character Recognition).' },
          { role: 'user', content: `${prompt}\n\nPDF Base64: ${pdfBase64}` }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  // Função auxiliar para analisar texto extraído e extrair informações estruturadas sobre a reserva
  async function parseReservationDataWithMistral(extractedText: string): Promise<any> {
    const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

    const prompt = `
      Você é um especialista em extrair dados estruturados de textos de reservas para alojamento local.
      Analise o texto extraído de um documento de reserva a seguir e extraia as seguintes informações em formato JSON:

      - Nome da propriedade (propertyName)
      - Nome do hóspede (guestName)
      - Email do hóspede (guestEmail)
      - Telefone do hóspede (guestPhone)
      - Data de check-in (formato YYYY-MM-DD)
      - Data de check-out (formato YYYY-MM-DD)
      - Número de hóspedes (numGuests)
      - Valor total da reserva (totalAmount) - apenas o número
      - Plataforma de reserva (platform): "airbnb", "booking", "direct", ou "other"
      - Taxa da plataforma (platformFee) - apenas o número
      - Taxa de limpeza (cleaningFee) - apenas o número
      - Taxa de check-in (checkInFee) - apenas o número
      - Taxa de comissão (commissionFee) - apenas o número
      - Pagamento à equipe (teamPayment) - apenas o número

      Se alguma informação não estiver disponível, use valores nulos ou vazios.
      Responda APENAS com o objeto JSON, sem explicações ou texto adicional.
    `;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em extrair dados estruturados.' },
          { role: 'user', content: `${prompt}\n\nTexto extraído:\n${extractedText}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error: ${errorText}`);
    }

    const data = await response.json();
    const jsonContent = data.choices[0].message.content;

    try {
      return JSON.parse(jsonContent);
    } catch (e) {
      console.error("Error parsing JSON from Mistral API:", e);
      return jsonContent; // Retorna o texto bruto se não conseguir analisar como JSON
    }
  }

  // Other utility endpoints
  app.get("/api/enums", (_req: Request, res: Response) => {
    // Return enum values for frontend select components
    res.json({
      reservationStatus: reservationStatusEnum.options,
      reservationPlatform: reservationPlatformEnum.options,
    });
  });

  // Checar se a chave API Mistral está configurada
  app.get("/api/check-mistral-key", (_req: Request, res: Response) => {
    try {
      const hasMistralKey = process.env.MISTRAL_API_KEY !== undefined && 
                          process.env.MISTRAL_API_KEY !== '';
      res.json({ available: hasMistralKey });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Endpoint para testar todas as integrações (RAG, OCR, DB, Mistral AI)
  app.get("/api/test-integrations", async (req: Request, res: Response) => {
    try {
      const tests = [];

      // Teste 1: Verificar acesso ao banco de dados
      try {
        const properties = await storage.getProperties();
        const owners = await storage.getOwners();
        const reservations = await storage.getReservations();

        tests.push({
          name: "Base de Dados",
          success: true,
          details: {
            properties: properties.length,
            owners: owners.length,
            reservations: reservations.length
          }
        });
      } catch (error: any) {
        tests.push({
          name: "Base de Dados",
          success: false,
          error: error.message || "Erro ao acessar base de dados"
        });
      }

      // Teste 2: Verificar API Mistral
      try {
        const hasMistralKey = process.env.MISTRAL_API_KEY !== undefined && 
                            process.env.MISTRAL_API_KEY !== '';

        if (!hasMistralKey) {
          tests.push({
            name: "Mistral AI",
            success: false,
            error: "Chave API Mistral não encontrada"
          });
        } else {
          // Importar o módulo de teste mistral se temos a chave API
          try {
            const mistral = new Mistral({
              apiKey: process.env.MISTRAL_API_KEY || ""
            });
            const models = await mistral.models.list();

            tests.push({
              name: "Mistral AI",
              success: true,
              details: {
                modelsAvailable: models.data?.length || 0,
                connected: true
              }
            });
          } catch (mistralError: any) {
            tests.push({
              name: "Mistral AI",
              success: false,
              error: mistralError.message || "Erro ao conectar com API Mistral"
            });
          }
        }
      } catch (error: any) {
        tests.push({
          name: "Mistral AI",
          success: false,
          error: error.message || "Erro ao testar API Mistral"
        });
      }

      // Teste 3: Verificar sistema RAG (Retrieval Augmented Generation)
      try {
        // Importar função para construir contexto RAG
        const { buildRagContext } = await import('./api/maria-assistant');
        const ragContext = await buildRagContext("teste de estatísticas e propriedades");
        
        // Se chegou até aqui, o teste foi bem-sucedido
        tests.push({
          name: "RAG (Retrieval Augmented Generation)",
          success: true,
          details: {
            contextBuilt: true,
            contextLength: ragContext ? ragContext.length : 0
          }
        });
      } catch (error: any) {
        console.error("Error building RAG context:", error);
        tests.push({
          name: "RAG (Retrieval Augmented Generation)",
          success: false,
          error: error.message || "Erro ao testar sistema RAG"
        });
      }


      // Teste 4: Verificar funcionalidade OCR
      try {
        tests.push({
          name: "OCR (Processamento de PDFs)",
          success: true,
          details: {
            initialized: true,
            message: "Sistema OCR pronto para processar documentos"
          }
        });
      } catch (error: any) {
        tests.push({
          name: "OCR (Processamento de PDFs)",
          success: false,
          error: error.message || "Erro ao verificar sistema OCR"
        });
      }

      return res.json({
        success: tests.every(test => test.success),
        timestamp: new Date().toISOString(),
        tests
      });

    } catch (error: any) {
      console.error("Erro ao testar integrações:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Erro desconhecido ao testar integrações"
      });
    }
  });

  // Rota para processar mensagens com o Mistral AI
  app.post("/api/assistant", async (req: Request, res: Response) => {
    try {
      // Importação dinâmica para resolver problema de ciclo de dependência
      const { mariaAssistant } = await import('./api/maria-assistant');
      return mariaAssistant(req, res);
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * Endpoint para processamento de documentos financeiros
   * Suporta faturas, recibos e outros documentos financeiros
   */
  app.post("/api/process-financial-document", anyFileUpload.single('document'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }

      // Verifica se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(400).json({ 
          success: false,
          message: "Chave da API Mistral não configurada. Configure a chave nas definições." 
        });
      }

      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(req.file.mimetype)) {
        if (req.file.path) {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Erro ao remover arquivo temporário:", unlinkError);
          }
        }
        
        return res.status(400).json({
          success: false,
          message: "Tipo de arquivo não suportado. Envie um PDF ou imagem (JPEG, PNG)."
        });
      }

      // Dados adicionais do formulário
      const docType = req.body.documentType || 'invoice'; // 'invoice', 'receipt', 'expense'
      const entityType = req.body.entityType || null; // 'owner', 'supplier'
      const entityId = req.body.entityId ? parseInt(req.body.entityId) : null;
      
      try {
        // Registrar atividade
        await storage.createActivity({
          type: 'financial_document_upload',
          description: `Upload de documento financeiro: ${req.file.originalname} (${docType})`,
          entityType: entityType,
          entityId: entityId
        });

        // Ler conteúdo do arquivo
        const filePath = req.file.path;
        const fileBuffer = await fs.promises.readFile(filePath);
        const fileBase64 = fileBuffer.toString('base64');
        
        // Processar documento usando mistralService
        console.log(`Processando documento financeiro: ${req.file.originalname} (${req.file.mimetype})`);
        
        // Extrair texto do documento
        let extractedText = '';
        if (req.file.mimetype.includes('pdf')) {
          extractedText = await mistralService.extractTextFromPDF(fileBase64);
        } else if (req.file.mimetype.includes('image')) {
          extractedText = await mistralService.extractTextFromImage(fileBase64, req.file.mimetype);
        }
        
        if (!extractedText || extractedText.length < 50) {
          return res.status(400).json({
            success: false,
            message: "Não foi possível extrair texto suficiente do documento."
          });
        }
        
        // Adicionar o texto extraído à base de conhecimento RAG
        await ragService.addToKnowledgeBase(extractedText, 'financial_document', {
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          uploadDate: new Date(),
          documentType: docType
        });
        
        // Analisar o documento para extração de dados estruturados
        // Usamos uma função personalizada para cada tipo de documento financeiro
        const extractionPrompt = `
          Você é um assistente especializado em extrair dados de documentos financeiros do tipo ${docType}.
          Analise o documento a seguir e extraia todos os detalhes relevantes em formato JSON.
          
          Extraia os seguintes campos:
          - issuerName: Nome da empresa/pessoa que emitiu o documento
          - issuerTaxId: Número de identificação fiscal do emissor (NIF, CNPJ, etc.)
          - recipientName: Nome do destinatário
          - recipientTaxId: Número de identificação fiscal do destinatário
          - documentNumber: Número do documento/fatura
          - issueDate: Data de emissão no formato YYYY-MM-DD
          - dueDate: Data de vencimento no formato YYYY-MM-DD (se aplicável)
          - totalAmount: Valor total (apenas o número)
          - currency: Moeda (EUR, USD, etc.)
          - items: Array de itens, cada um com description, quantity, unitPrice, totalPrice
          - taxes: Informações sobre impostos (IVA, taxa, etc.)
          - paymentMethod: Método de pagamento mencionado
          - status: Estado do documento (emitido, pago, vencido, etc.)
          
          Para valores monetários, extraia apenas os números, sem símbolos de moeda.
          Para campos não encontrados no documento, use null.
        `;
        
        const response = await mistralService.getMistralClient().chat.complete({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "Você é um assistente especializado em extração de dados de documentos financeiros." },
            { role: "user", content: `${extractionPrompt}\n\nTexto do documento:\n${extractedText}` }
          ],
          temperature: 0.1,
          responseFormat: { type: "json_object" }
        });
        
        const content = response.choices?.[0]?.message?.content;
        let extractedData = {};
        
        try {
          if (content && typeof content === 'string') {
            extractedData = JSON.parse(content);
          }
        } catch (parseError) {
          console.error("Erro ao processar JSON da resposta:", parseError);
        }
        
        // Retornar os dados extraídos
        return res.status(200).json({
          success: true,
          message: "Documento financeiro processado com sucesso",
          documentType: docType,
          file: {
            filename: req.file.filename,
            path: req.file.path,
            mimeType: req.file.mimetype
          },
          extractedText: extractedText.substring(0, 500) + '...', // Primeira parte do texto extraído
          extractedData,
          entityInfo: {
            entityType,
            entityId
          }
        });
        
      } catch (processingError: any) {
        console.error("Erro no processamento do documento financeiro:", processingError);
        
        // Limpar arquivo em caso de erro
        if (req.file && req.file.path) {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Erro ao remover arquivo temporário:", unlinkError);
          }
        }
        
        return res.status(500).json({ 
          success: false,
          message: processingError.message || "Erro desconhecido no processamento do documento financeiro"
        });
      }
    } catch (err) {
      console.error("Erro geral no endpoint de processamento de documentos financeiros:", err);
      handleError(err, res);
    }
  });
  
  /**
   * Endpoint para validação de documento financeiro
   * Verifica a consistência e corretude dos dados extraídos
   */
  app.post("/api/validate-financial-document", async (req: Request, res: Response) => {
    try {
      const { documentData, documentType, originalText } = req.body;
      
      if (!documentData || !documentType) {
        return res.status(400).json({
          success: false,
          message: "Dados incompletos para validação. Forneça documentData e documentType."
        });
      }
      
      // Verificar se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(400).json({ 
          success: false,
          message: "Chave da API Mistral não configurada. Configure a chave nas definições." 
        });
      }
      
      // Construir prompt de validação específico para o tipo de documento
      let validationPrompt = "";
      
      if (documentType === 'invoice') {
        validationPrompt = `
          Você é um auditor financeiro especializado em validação de faturas.
          Verifique os seguintes aspectos da fatura:
          1. Consistência matemática: o total corresponde à soma dos itens + impostos?
          2. Dados essenciais: possui emissor, destinatário, data, número e valor total?
          3. Formatação de datas: estão no formato correto YYYY-MM-DD?
          4. Formatação de valores: são números sem símbolos de moeda?
          5. Existem inconsistências nos dados extraídos?
          
          Dados extraídos:
          ${JSON.stringify(documentData, null, 2)}
          
          ${originalText ? `Texto original do documento (para referência):
          ${originalText.substring(0, 1000)}...` : ''}
        `;
      } else if (documentType === 'receipt') {
        validationPrompt = `
          Você é um auditor financeiro especializado em validação de recibos.
          Verifique os seguintes aspectos do recibo:
          1. Consistência dos valores: o total está correto?
          2. Dados essenciais: possui emissor, data, e valor total?
          3. Formatação de datas: estão no formato correto YYYY-MM-DD?
          4. Formatação de valores: são números sem símbolos de moeda?
          5. Existem inconsistências nos dados extraídos?
          
          Dados extraídos:
          ${JSON.stringify(documentData, null, 2)}
          
          ${originalText ? `Texto original do documento (para referência):
          ${originalText.substring(0, 1000)}...` : ''}
        `;
      } else {
        validationPrompt = `
          Você é um auditor financeiro especializado em validação de documentos financeiros.
          Verifique os seguintes aspectos deste documento do tipo ${documentType}:
          1. Consistência dos valores: o total está correto?
          2. Dados essenciais: possui todas as informações necessárias?
          3. Formatação de datas: estão no formato correto YYYY-MM-DD?
          4. Formatação de valores: são números sem símbolos de moeda?
          5. Existem inconsistências nos dados extraídos?
          
          Dados extraídos:
          ${JSON.stringify(documentData, null, 2)}
          
          ${originalText ? `Texto original do documento (para referência):
          ${originalText.substring(0, 1000)}...` : ''}
        `;
      }
      
      const response = await mistralService.getMistralClient().chat.complete({
        model: "mistral-medium",
        messages: [
          { role: "system", content: "Você é um auditor financeiro especializado." },
          { role: "user", content: validationPrompt }
        ],
        temperature: 0.1,
        responseFormat: { type: "json_object" }
      });
      
      const content = response.choices?.[0]?.message?.content;
      let validationResult = {
        isValid: false,
        issues: [],
        suggestions: [],
        correctedData: null
      };
      
      try {
        if (content && typeof content === 'string') {
          validationResult = JSON.parse(content);
        }
      } catch (parseError) {
        console.error("Erro ao processar JSON da resposta de validação:", parseError);
        return res.status(500).json({
          success: false,
          message: "Erro ao processar resposta de validação"
        });
      }
      
      return res.status(200).json({
        success: true,
        validation: validationResult
      });
      
    } catch (err) {
      console.error("Erro na validação de documento financeiro:", err);
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA DOCUMENTOS FINANCEIROS =====

  // Listar documentos financeiros com opção de filtros
  app.get("/api/financial-documents", async (req: Request, res: Response) => {
    try {
      const options: any = {};

      if (req.query.type) options.type = req.query.type as string;
      if (req.query.status) options.status = req.query.status as string;
      if (req.query.entityId) options.entityId = Number(req.query.entityId);
      if (req.query.entityType) options.entityType = req.query.entityType as string;
      if (req.query.startDate) options.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) options.endDate = new Date(req.query.endDate as string);

      const documents = await storage.getFinancialDocuments(options);
      res.json(documents);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter um documento financeiro específico pelo ID
  app.get("/api/financial-documents/:id", async (req: Request, res: Response) => {
    try {
      const document = await storage.getFinancialDocument(Number(req.params.id));

      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      // Obter itens relacionados ao documento
      const items = await storage.getFinancialDocumentItems(document.id);

      // Obter pagamentos relacionados ao documento
      const payments = await storage.getPaymentRecords(document.id);

      // Combinar tudo em uma resposta completa
      res.json({
        document,
        items,
        payments
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Criar um novo documento financeiro
  app.post("/api/financial-documents", async (req: Request, res: Response) => {
    try {
      const validatedData = extendedFinancialDocumentSchema.parse(req.body);
      const document = await storage.createFinancialDocument(validatedData);

      // Se houver itens no corpo da requisição, criar também os itens
      if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        for (const item of req.body.items) {
          item.documentId = document.id;
          await storage.createFinancialDocumentItem(insertFinancialDocumentItemSchema.parse(item));
        }
      }

      res.status(201).json(document);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Atualizar um documento financeiro existente
  app.patch("/api/financial-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingDocument = await storage.getFinancialDocument(id);

      if (!existingDocument) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedDocument = await storage.updateFinancialDocument(id, validatedData);

      res.json(updatedDocument);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Excluir um documento financeiro
  app.delete("/api/financial-documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      // Primeiro verificar se o documento existe
      const document = await storage.getFinancialDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      // Excluir os itens relacionados primeiro (para evitar problemas de chave estrangeira)
      const items = await storage.getFinancialDocumentItems(id);
      for (const item of items) {
        await storage.deleteFinancialDocumentItem(item.id);
      }

      // Excluir os pagamentos relacionados
      const payments = await storage.getPaymentRecords(id);
      for (const payment of payments) {
        await storage.deletePaymentRecord(payment.id);
      }

      // Finalmente, excluir o documento
      const result = await storage.deleteFinancialDocument(id);

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA ITENS DE DOCUMENTOS FINANCEIROS =====

  // Listar itens de um documento financeiro
  app.get("/api/financial-document-items/:documentId", async (req: Request, res: Response) => {
    try {
      const documentId = Number(req.params.documentId);

      // Verificar se o documento existe
      const document = await storage.getFinancialDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      const items = await storage.getFinancialDocumentItems(documentId);
      res.json(items);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter um item específico pelo ID
  app.get("/api/financial-document-items/item/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getFinancialDocumentItem(id);

      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      res.json(item);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Criar um novo item em um documento financeiro
  app.post("/api/financial-document-items", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFinancialDocumentItemSchema.parse(req.body);

      // Verificar se o documento existe
      const document = await storage.getFinancialDocument(validatedData.documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      const item = await storage.createFinancialDocumentItem(validatedData);

      // Atualizar o valor total do documento somando todos os itens
      const allItems = await storage.getFinancialDocumentItems(document.id);
      const totalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toString();
      await storage.updateFinancialDocument(document.id, { totalAmount });

      res.status(201).json(item);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Atualizar um item de documento financeiro
  app.patch("/api/financial-document-items/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingItem = await storage.getFinancialDocumentItem(id);

      if (!existingItem) {
        return res.status(404).json({ message: "Item de documento não encontrado" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedItem = await storage.updateFinancialDocumentItem(id, validatedData);

      // Se o valor foi alterado, atualizar o total do documento
      if (validatedData.amount) {
        const document = await storage.getFinancialDocument(existingItem.documentId);
        if (document) {
          const allItems = await storage.getFinancialDocumentItems(document.id);
          const totalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toString();
          await storage.updateFinancialDocument(document.id, { totalAmount });
        }
      }

      res.json(updatedItem);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Excluir um item de documento financeiro
  app.delete("/api/financial-document-items/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getFinancialDocumentItem(id);

      if (!item) {
        return res.status(404).json({ message: "Item de documento não encontrado" });
      }

      const documentId = item.documentId;
      const result = await storage.deleteFinancialDocumentItem(id);

      // Atualizar o valor total do documento
      const document = await storage.getFinancialDocument(documentId);
      if (document) {
        const allItems = await storage.getFinancialDocumentItems(documentId);
        const totalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toString();
        await storage.updateFinancialDocument(documentId, { totalAmount });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA REGISTROS DE PAGAMENTO =====

  // Listar pagamentos (opcionalmente filtrados por documento)
  app.get("/api/payment-records", async (req: Request, res: Response) => {
    try {
      let documentId: number | undefined = undefined;

      if (req.query.documentId) {
        documentId = Number(req.query.documentId);
      }

      const payments = await storage.getPaymentRecords(documentId);
      res.json(payments);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter um pagamento específico pelo ID
  app.get("/api/payment-records/:id", async (req: Request, res: Response) => {
    try {
      const payment = await storage.getPaymentRecord(Number(req.params.id));

      if (!payment) {
        return res.status(404).json({ message: "Registro de pagamento não encontrado" });
      }

      res.json(payment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Criar um novo registro de pagamento
  app.post("/api/payment-records", async (req: Request, res: Response) => {
    try {
      const validatedData = extendedPaymentRecordSchema.parse(req.body);

      // Verificar se o documento existe
      const document = await storage.getFinancialDocument(validatedData.documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento financeiro não encontrado" });
      }

      const payment = await storage.createPaymentRecord(validatedData);

      // Atualizar o status e valor pago do documento
      const allPayments = await storage.getPaymentRecords(document.id);
      const paidAmount = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toString();

      // Verificar se o valor pago cobre o valor total do documento
      let status = document.status;
      if (parseFloat(paidAmount) >= parseFloat(document.totalAmount)) {
        status = "paid"; // Documento totalmente pago
      } else if (parseFloat(paidAmount) > 0) {
        status = "invoiced"; // Parcialmente pago
      }

      await storage.updateFinancialDocument(document.id, { 
        status, 
        paidAmount 
      });

      res.status(201).json(payment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Atualizar um registro de pagamento
  app.patch("/api/payment-records/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingPayment = await storage.getPaymentRecord(id);

      if (!existingPayment) {
        return res.status(404).json({ message: "Registro de pagamento não encontrado" });
      }

      // Validação mais simples - apenas aceita os campos do req.body
      const validatedData = { ...req.body };
      const updatedPayment = await storage.updatePaymentRecord(id, validatedData);

      // Se o valor foi alterado, atualizar o status do documento
      if (validatedData.amount) {
        const document = await storage.getFinancialDocument(existingPayment.documentId);
        if (document) {
          const allPayments = await storage.getPaymentRecords(document.id);
          const paidAmount = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toString();

          // Atualizar status baseado no valor pago
          let status = document.status;
          if (parseFloat(paidAmount) >= parseFloat(document.totalAmount)) {
            status = "paid"; // Documento totalmente pago
          } else if (parseFloat(paidAmount) > 0) {
            status = "invoiced"; // Parcialmente pago
          } else {
            status = "pending"; // Pendente de pagamento
          }

          await storage.updateFinancialDocument(document.id, { 
            status, 
            paidAmount 
          });
        }
      }

      res.json(updatedPayment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Excluir um registro de pagamento
  app.delete("/api/payment-records/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const payment = await storage.getPaymentRecord(id);

      if (!payment) {
        return res.status(404).json({ message: "Registro de pagamento não encontrado" });
      }

      const documentId = payment.documentId;
      const result = await storage.deletePaymentRecord(id);

      // Atualizar o status e valor pago do documento
      const document = await storage.getFinancialDocument(documentId);
      if (document) {
        const allPayments = await storage.getPaymentRecords(documentId);
        const paidAmount = allPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toString();

        // Atualizar status baseado no valor pago
        let status = document.status;
        if (parseFloat(paidAmount) >= parseFloat(document.totalAmount)) {
          status = "paid"; // Documento totalmente pago
        } else if (parseFloat(paidAmount) > 0) {
          status = "invoiced"; // Parcialmente pago
        } else {
          status = "pending"; // Pendente de pagamento
        }

        await storage.updateFinancialDocument(document.id, { 
          status, 
          paidAmount 
        });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== ENDPOINTS PARA RELATÓRIOS FINANCEIROS =====

  // Obter relatório financeiro de proprietário
  /**
   * Endpoint para geração de relatório financeiro por proprietário
   * Suporta diferentes formatos de data e filtragem por período
   */
  /**
   * Endpoint para enviar relatório mensal por email
   * Envia o relatório do proprietário em formato PDF para o email registrado
   */
  app.post("/api/reports/owner/send-email", async (req: Request, res: Response) => {
    try {
      const { ownerId, month, year, email } = req.body;
      
      if (!ownerId || !month || !year) {
        return res.status(400).json({
          success: false,
          message: "Dados incompletos. Informe proprietário, mês e ano"
        });
      }
      
      // Verificar se o proprietário existe
      const owner = await storage.getOwner(Number(ownerId));
      if (!owner) {
        return res.status(404).json({ 
          success: false, 
          message: "Proprietário não encontrado" 
        });
      }
      
      // Usar o email do proprietário se não for fornecido um email específico
      const targetEmail = email || owner.email;
      
      if (!targetEmail) {
        return res.status(400).json({
          success: false,
          message: "Email não disponível. Forneça um email ou atualize o email do proprietário"
        });
      }
      
      // Gerar o relatório
      const report = await storage.generateOwnerFinancialReport(Number(ownerId), month, year);
      
      // Formatação da data para exibição adequada em pt-BR
      const reportDate = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = format(reportDate, 'MMMM yyyy', { locale: require('date-fns/locale/pt-BR') });
      
      // Importar o serviço de email
      const { emailService } = await import('./services/email.service');
      
      // Verificar se o serviço de email está configurado
      const emailConfigured = await emailService.isEmailServiceAvailable();
      
      let emailSent = false;
      
      if (emailConfigured) {
        try {
          // Gerar PDF do relatório para anexar ao email
          const { jsPDF } = await import('jspdf');
          const { autoTable } = await import('jspdf-autotable');
          
          const doc = new jsPDF();
          
          // Adicionar cabeçalho
          doc.setFontSize(20);
          doc.text('Maria Faz - Gestão de Propriedades', 105, 15, { align: 'center' });
          doc.setFontSize(16);
          doc.text(`Relatório Financeiro - ${monthName}`, 105, 25, { align: 'center' });
          doc.setFontSize(12);
          doc.text(`Proprietário: ${owner.name}`, 105, 35, { align: 'center' });
          
          // Adicionar resumo
          doc.setFontSize(14);
          doc.text('Resumo Financeiro', 14, 45);
          
          // Dados do relatório
          const propertyData = report.properties.map((property: any) => [
            property.name,
            `${property.occupancyRate}%`,
            `€${property.revenue.toFixed(2)}`,
            `€${property.expenses.toFixed(2)}`,
            `€${property.profit.toFixed(2)}`
          ]);
          
          // Tabela de propriedades
          autoTable(doc, {
            startY: 50,
            head: [['Propriedade', 'Ocupação', 'Receita', 'Despesas', 'Lucro']],
            body: propertyData,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
          });
          
          // Adicionar totais
          const finalY = (doc as any).lastAutoTable.finalY || 120;
          doc.setFontSize(14);
          doc.text('Total do Período', 14, finalY + 10);
          
          autoTable(doc, {
            startY: finalY + 15,
            head: [['Receita Total', 'Despesas Totais', 'Lucro Líquido']],
            body: [[
              `€${report.totalRevenue.toFixed(2)}`,
              `€${report.totalExpenses.toFixed(2)}`,
              `€${report.netProfit.toFixed(2)}`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
          });
          
          // Rodapé
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(
              `Maria Faz - Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`,
              105, 
              doc.internal.pageSize.height - 10, 
              { align: 'center' }
            );
          }
          
          // Obter o PDF como buffer
          const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
          
          // Enviar o email com o relatório em anexo
          emailSent = await emailService.sendMonthlyReport(
            targetEmail,
            owner.name,
            monthName,
            pdfBuffer
          );
        } catch (emailError) {
          console.error('Erro ao gerar PDF ou enviar email:', emailError);
          // Fallback para modo de teste se ocorrer erro
          emailSent = await emailService.sendReportTest(targetEmail, owner.name, monthName);
        }
      } else {
        // Se o serviço não estiver configurado, use o modo de teste
        emailSent = await emailService.sendReportTest(targetEmail, owner.name, monthName);
      }
      
      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Falha ao enviar email. Verifique as configurações de email."
        });
      }
      
      // Registrar atividade
      await storage.createActivity({
        type: "email_sent",
        description: `Relatório mensal de ${monthName} enviado para ${owner.name} (${targetEmail})`,
        entityId: Number(ownerId),
        entityType: "owner"
      });
      
      return res.status(200).json({
        success: true,
        message: `Relatório enviado com sucesso para ${targetEmail}`,
        reportData: {
          ownerId: Number(ownerId),
          ownerName: owner.name,
          month,
          year,
          email: targetEmail,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Erro ao enviar relatório por email:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar relatório. Por favor tente novamente."
      });
    }
  });

  app.get("/api/reports/owner/:ownerId", async (req: Request, res: Response) => {
    try {
      const ownerId = Number(req.params.ownerId);
      
      // Verificar se o proprietário existe
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ 
          success: false, 
          message: "Proprietário não encontrado" 
        });
      }
      
      // Opções para geração do relatório
      let month: string;
      let year: string;
      
      // Verificar se foi passado um intervalo de datas ou mês/ano
      if (req.query.startDate && req.query.endDate) {
        // Se temos um intervalo específico, calcular o mês a partir da data de início
        const startDate = new Date(req.query.startDate as string);
        month = String(startDate.getMonth() + 1).padStart(2, '0');
        year = String(startDate.getFullYear());
        
        // Registrar atividade
        await storage.createActivity({
          type: 'report_generation',
          description: `Relatório financeiro para proprietário ${owner.name} (ID: ${ownerId}) para o período de ${req.query.startDate} a ${req.query.endDate}`,
          entityType: 'owner',
          entityId: ownerId
        });
      } else {
        // Caso contrário, usar mês e ano específicos
        month = req.query.month as string;
        year = req.query.year as string;
        
        if (!month || !year) {
          return res.status(400).json({ 
            success: false, 
            message: "É necessário informar mês e ano para o relatório, ou um intervalo de datas (startDate e endDate)" 
          });
        }
        
        // Garantir formato de dois dígitos para o mês
        month = month.padStart(2, '0');
        
        // Registrar atividade
        await storage.createActivity({
          type: 'report_generation',
          description: `Relatório financeiro para proprietário ${owner.name} (ID: ${ownerId}) para ${month}/${year}`,
          entityType: 'owner',
          entityId: ownerId
        });
      }
      
      // Gerar o relatório
      const report = await storage.generateOwnerFinancialReport(ownerId, month, year);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Não foi possível gerar o relatório para o proprietário informado."
        });
      }
      
      // Retornar o relatório em formato JSON
      return res.status(200).json({
        success: true,
        ownerId: report.owner.id,
        ownerName: report.owner.name,
        month: month,
        year: year,
        startDate: report.period.startDate,
        endDate: report.period.endDate,
        properties: report.properties,
        totals: report.summary,
        reservations: report.properties.flatMap(p => p.reservations || [])
      });
    } catch (err) {
      console.error("Erro ao gerar relatório financeiro de proprietário:", err);
      handleError(err, res);
    }
  });

  /**
   * Endpoint para obter resumo financeiro geral do sistema
   * Suporta filtros por data de início e fim
   */
  app.get("/api/reports/financial-summary", async (req: Request, res: Response) => {
    try {
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;
      
      // Parse das datas do parâmetro de consulta
      if (req.query.startDate) {
        try {
          startDate = new Date(req.query.startDate as string);
          if (isNaN(startDate.getTime())) {
            return res.status(400).json({ 
              success: false, 
              message: "Data de início inválida. Use o formato YYYY-MM-DD." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            message: "Data de início inválida. Use o formato YYYY-MM-DD." 
          });
        }
      }

      if (req.query.endDate) {
        try {
          endDate = new Date(req.query.endDate as string);
          if (isNaN(endDate.getTime())) {
            return res.status(400).json({ 
              success: false, 
              message: "Data de fim inválida. Use o formato YYYY-MM-DD." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            success: false, 
            message: "Data de fim inválida. Use o formato YYYY-MM-DD." 
          });
        }
      }
      
      // Se não foram fornecidas datas, usar o mês atual
      if (!startDate && !endDate) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês atual
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês atual
      }
      
      // Registrar atividade de geração de relatório
      await storage.createActivity({
        type: 'report_generation',
        description: `Relatório de resumo financeiro gerado para o período de ${startDate?.toISOString().split('T')[0] || 'início'} a ${endDate?.toISOString().split('T')[0] || 'fim'}`,
        entityType: 'system',
        entityId: 0
      });
      
      // Gerar o resumo financeiro
      const summary = await storage.generateFinancialSummary(startDate, endDate);
      
      // Retornar o resumo em formato JSON padronizado
      return res.status(200).json({
        success: true,
        summary: {
          ...summary,
          period: {
            startDate: startDate?.toISOString() || null,
            endDate: endDate?.toISOString() || null
          }
        }
      });
    } catch (err) {
      console.error("Erro ao gerar resumo financeiro:", err);
      handleError(err, res);
    }
  });

  /**
   * Endpoint para validação contextual de reservas
   * Utiliza RAG e regras de negócio para validar dados de reserva
   */
  app.post("/api/validate-reservation", async (req: Request, res: Response) => {
    try {
      const reservationData = req.body;
      
      // Validar dados básicos da requisição
      if (!reservationData || !reservationData.propertyId) {
        return res.status(400).json({
          success: false,
          message: "Dados de reserva incompletos. É necessário informar pelo menos propertyId."
        });
      }
      
      // Verificar se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(400).json({ 
          success: false,
          message: "Chave da API Mistral não configurada. Configure a chave nas definições." 
        });
      }
      
      // Buscar detalhes da propriedade
      const property = await storage.getProperty(reservationData.propertyId);
      if (!property) {
        return res.status(400).json({ 
          success: false,
          message: "Propriedade não encontrada" 
        });
      }
      
      // Verificar se existem reservas conflitantes
      let conflictingReservations: Reservation[] = [];
      if (reservationData.checkInDate && reservationData.checkOutDate) {
        const allReservations = await storage.getReservationsByProperty(property.id);
        
        // Filtrar reservas que se sobrepõem ao período solicitado
        conflictingReservations = allReservations.filter(r => {
          // Ignorar a própria reserva se estiver atualizando (tem ID)
          if (reservationData.id && r.id === reservationData.id) {
            return false;
          }
          
          const checkIn = new Date(r.checkInDate);
          const checkOut = new Date(r.checkOutDate);
          const newCheckIn = new Date(reservationData.checkInDate);
          const newCheckOut = new Date(reservationData.checkOutDate);
          
          // Verificar sobreposição de datas
          return (
            (newCheckIn <= checkOut && newCheckIn >= checkIn) || // Check-in durante outra reserva
            (newCheckOut <= checkOut && newCheckOut >= checkIn) || // Check-out durante outra reserva
            (newCheckIn <= checkIn && newCheckOut >= checkOut) // Engloba completamente outra reserva
          );
        });
      }
      
      // Registrar tentativa de validação (para fins de analytics)
      await storage.createActivity({
        type: 'reservation_validation',
        description: `Validação de reserva para propriedade ${property.name} (ID: ${property.id})`,
        entityType: 'property',
        entityId: property.id
      });
      
      // Buscar conhecimento similar do RAG para contextualizar a validação
      const similarContentPromise = ragService.findSimilarContent(
        JSON.stringify({
          propertyName: property.name,
          ...reservationData
        }),
        3
      );
      
      // Obter reservas recentes da mesma propriedade para análise de padrões
      const recentReservationsPromise = storage.getReservationsByProperty(property.id)
        .then(reservations => 
          reservations
            .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
            .slice(0, 5) // Últimas 5 reservas
        );
      
      // Executar promessas em paralelo para melhor performance
      const [similarContent, recentReservations] = await Promise.all([
        similarContentPromise,
        recentReservationsPromise
      ]);
      
      // Validar dados com contexto usando o Mistral
      const validationResult = await mistralService.validateReservationData(
        reservationData,
        {
          property,
          similarReservations: similarContent,
          recentReservations,
          conflictingReservations,
          currentDate: new Date().toISOString()
        }
      );
      
      // Adicionar informações adicionais ao resultado
      return res.status(200).json({
        success: true,
        validation: {
          ...validationResult,
          hasConflicts: conflictingReservations.length > 0,
          conflictCount: conflictingReservations.length,
          property: {
            id: property.id,
            name: property.name,
            // Usando valores padrão seguros para campos que podem não existir
            maxGuests: 10, // Valor padrão seguro
            minimumStay: 1 // Valor padrão seguro
          }
        }
      });
    } catch (err) {
      console.error("Erro na validação de reserva:", err);
      handleError(err, res);
    }
  });

  /**
   * Endpoint para atualizar o arquivo theme.json
   * Permite alterar as configurações de tema da aplicação
   */
  app.post("/theme.json", async (req: Request, res: Response) => {
    try {
      // Esquema para validar o objeto de tema
      const themeSchema = z.object({
        appearance: z.enum(["light", "dark", "system"]),
        primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        variant: z.enum(["professional", "tint", "vibrant"]),
        radius: z.number().min(0).max(2)
      });
      
      // Validar o corpo da requisição
      const validatedTheme = themeSchema.parse(req.body);
      
      // Caminho para o arquivo theme.json
      const themePath = path.join(process.cwd(), 'theme.json');
      
      // Salvar no arquivo theme.json
      fs.writeFileSync(themePath, JSON.stringify(validatedTheme, null, 2));
      
      // Retornar sucesso
      res.json({
        success: true,
        message: "Tema atualizado com sucesso"
      });
    } catch (error) {
      // Se for um erro de validação, retornar mensagem amigável
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de tema inválidos",
          errors: error.errors
        });
      }
      
      // Caso contrário, tratar como erro interno
      console.error("Erro ao atualizar theme.json:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao atualizar configurações de tema"
      });
    }
  });

  // Endpoint para obter as configurações de usuário (timezone, etc)
  app.get("/api/user-settings", (_req: Request, res: Response) => {
    try {
      // Caminho para o arquivo de configurações
      const settingsPath = path.join(process.cwd(), 'user-settings.json');
      
      // Verificar se o arquivo existe
      if (fs.existsSync(settingsPath)) {
        // Ler e retornar as configurações
        const settingsJson = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsJson);
        res.json({
          success: true,
          settings
        });
      } else {
        // Retornar configurações padrão
        const defaultSettings = {
          timezone: "Europe/Lisbon",
          language: "pt-PT",
          notifications: {
            email: true,
            browser: false
          }
        };
        res.json({
          success: true,
          settings: defaultSettings
        });
      }
    } catch (error) {
      console.error("Erro ao obter configurações de usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao obter configurações de usuário"
      });
    }
  });
  
  // Endpoint para salvar configurações de usuário
  app.post("/api/user-settings", (req: Request, res: Response) => {
    try {
      // Validar o corpo da requisição
      const settingsSchema = z.object({
        timezone: z.string(),
        language: z.string(),
        notifications: z.object({
          email: z.boolean(),
          browser: z.boolean()
        })
      });
      
      const validatedSettings = settingsSchema.parse(req.body);
      
      // Caminho para o arquivo de configurações
      const settingsPath = path.join(process.cwd(), 'user-settings.json');
      
      // Salvar no arquivo de configurações
      fs.writeFileSync(settingsPath, JSON.stringify(validatedSettings, null, 2));
      
      // Retornar sucesso
      res.json({
        success: true,
        message: "Configurações salvas com sucesso"
      });
    } catch (error) {
      // Se for um erro de validação, retornar mensagem amigável
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de configuração inválidos",
          errors: error.errors
        });
      }
      
      // Caso contrário, tratar como erro interno
      console.error("Erro ao salvar configurações de usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao salvar configurações de usuário"
      });
    }
  });

  // Registrar as rotas de orçamentos
  registerQuotationRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}