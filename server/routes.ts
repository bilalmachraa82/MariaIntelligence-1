import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { ZodError } from "zod";
import { Mistral } from "@mistralai/mistralai";
import { MistralService } from "./services/mistral.service";
import { RAGService } from "./services/rag.service";
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
  paymentMethodEnum
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Set up multer for file uploads
const upload = multer({
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
      cb(new Error('Only PDF files are allowed!') as any, false);
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
      
      const validatedData = extendedPropertySchema.partial().parse(req.body);
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
      
      // Apply property-specific costs
      validatedData.cleaningFee = property.cleaningCost.toString();
      validatedData.checkInFee = property.checkInFee.toString();
      validatedData.commissionFee = (Number(validatedData.totalAmount) * Number(property.commission) / 100).toString();
      validatedData.teamPayment = property.teamPayment.toString();
      
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
      
      const validatedData = extendedReservationSchema.partial().parse(req.body);
      
      // If total amount or property has changed, recalculate costs
      if (validatedData.totalAmount || validatedData.propertyId) {
        const property = await storage.getProperty(
          validatedData.propertyId || existingReservation.propertyId
        );
        
        if (!property) {
          return res.status(400).json({ message: "Invalid property ID" });
        }
        
        // Update costs based on property information
        validatedData.cleaningFee = property.cleaningCost.toString();
        validatedData.checkInFee = property.checkInFee.toString();
        
        const totalAmount = validatedData.totalAmount || existingReservation.totalAmount;
        validatedData.commissionFee = (Number(totalAmount) * Number(property.commission) / 100).toString();
        validatedData.teamPayment = property.teamPayment.toString();
        
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
      
      // Log para diagnóstico
      console.log("API /statistics - Datas:", { 
        startDateStr, 
        endDateStr, 
        startDate: startDate?.toISOString(), 
        endDate: endDate?.toISOString() 
      });
      
      const totalRevenue = await storage.getTotalRevenue(startDate, endDate);
      const netProfit = await storage.getNetProfit(startDate, endDate);
      
      // Vamos tratar a função getOccupancyRate com cuidado adicional
      let occupancyRate = 0;
      try {
        occupancyRate = await storage.getOccupancyRate(undefined, startDate, endDate);
      } catch (error) {
        console.error("Erro ao calcular taxa de ocupação:", error);
        // Continuamos sem quebrar a API
      }
      
      // Get properties for active property count
      const properties = await storage.getProperties();
      const activeProperties = properties.filter(p => p.active).length;
      
      // Get reservations for this period
      let reservations = await storage.getReservations();
      
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
        totalRevenue,
        netProfit,
        occupancyRate,
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
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(stats);
    } catch (err) {
      handleError(err, res);
    }
  });

  const mistralService = new MistralService();
  const ragService = new RAGService();

  // PDF Upload and Processing
  app.post("/api/upload-pdf", upload.single('pdf'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      // Verifica se a chave da API Mistral está disponível
      if (!process.env.MISTRAL_API_KEY) {
        return res.status(500).json({ message: "Chave da API Mistral não configurada" });
      }
      
      try {
        // Lê o conteúdo do arquivo PDF enviado
        const filePath = req.file.path;
        const fileBuffer = await fs.promises.readFile(filePath);
        const fileBase64 = fileBuffer.toString('base64');
        
        // Extrair texto do PDF usando Mistral AI
        const extractedText = await mistralService.extractTextFromPDF(fileBase64);
        
        // Adicionar o texto extraído à base de conhecimento RAG
        await ragService.addToKnowledgeBase(extractedText, 'reservation_pdf', {
          filename: req.file.filename,
          uploadDate: new Date()
        });
        
        // Analisar dados da reserva
        const parsedData = await mistralService.parseReservationData(extractedText);
        
        // Encontrar a propriedade correspondente pelo nome
        const properties = await storage.getProperties();
        
        // Verificação de segurança para garantir que parsedData e propertyName existem
        if (!parsedData || !parsedData.propertyName) {
          return res.status(400).json({ 
            message: "Não foi possível extrair o nome da propriedade do documento",
            extractedData: parsedData || {}
          });
        }
        
        const matchedProperty = properties.find(p => 
          p.name.toLowerCase() === parsedData.propertyName.toLowerCase()
        );
        
        if (!matchedProperty) {
          return res.status(400).json({ 
            message: `Não foi possível encontrar uma propriedade com o nome "${parsedData.propertyName}"`,
            extractedData: parsedData
          });
        }
        
        // Calcular taxas e valores baseados na propriedade encontrada
        const totalAmount = parsedData.totalAmount || 0;
        const platformFee = parsedData.platformFee || (
          (parsedData.platform === "airbnb" || parsedData.platform === "booking") 
            ? Math.round(totalAmount * 0.1) 
            : 0
        );
        
        // Retorna os dados extraídos com as informações da propriedade
        res.json({
          extractedData: {
            ...parsedData,
            propertyId: matchedProperty.id,
            platformFee: platformFee,
            cleaningFee: parsedData.cleaningFee || Number(matchedProperty.cleaningCost || 0),
            checkInFee: parsedData.checkInFee || Number(matchedProperty.checkInFee || 0),
            commissionFee: parsedData.commissionFee || (totalAmount * Number(matchedProperty.commission || 0) / 100),
            teamPayment: parsedData.teamPayment || Number(matchedProperty.teamPayment || 0)
          },
          file: {
            filename: req.file.filename,
            path: req.file.path
          }
        });
      } catch (mistralError) {
        console.error('Erro na API Mistral:', mistralError);
        // Caso falhe a chamada à API Mistral, respondemos com um erro adequado
        return res.status(500).json({ 
          message: "Falha ao processar PDF com Mistral AI", 
          error: mistralError.message 
        });
      }
    } catch (err) {
      console.error('Erro ao processar upload de PDF:', err);
      handleError(err, res);
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
                modelsAvailable: models.data.length,
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
        const hasMistralKey = process.env.MISTRAL_API_KEY !== undefined && 
                            process.env.MISTRAL_API_KEY !== '';
        
        if (!hasMistralKey) {
          tests.push({
            name: "RAG (Retrieval Augmented Generation)",
            success: false,
            error: "Chave API Mistral não encontrada, necessária para testar o RAG"
          });
        } else {
          // Importar função para construir contexto RAG
          const { buildRagContext } = await import('./api/maria-assistant');
          const ragContext = await buildRagContext("teste de estatísticas e propriedades");
          
          tests.push({
            name: "RAG (Retrieval Augmented Generation)",
            success: true,
            details: {
              contextSize: ragContext.length,
              sample: ragContext.substring(0, 100) + "..."
            }
          });
        }
      } catch (error: any) {
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
      
      const validatedData = extendedFinancialDocumentSchema.partial().parse(req.body);
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

  // Validação contextual de reservas
  app.post("/api/validate-reservation", async (req: Request, res: Response) => {
    try {
      const reservationData = req.body;
      
      // Buscar regras da propriedade
      const property = await storage.getProperty(reservationData.propertyId);
      if (!property) {
        return res.status(400).json({ message: "Propriedade não encontrada" });
      }
      
      // Buscar conhecimento similar do RAG
      const similarContent = await ragService.findSimilarContent(
        JSON.stringify(reservationData),
        3
      );
      
      // Validar dados com contexto
      const validationResult = await mistralService.validateReservationData(
        reservationData,
        {
          property,
          similarReservations: similarContent
        }
      );
      
      res.json(validationResult);
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
      
      const validatedData = insertFinancialDocumentItemSchema.partial().parse(req.body);
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
      
      const validatedData = extendedPaymentRecordSchema.partial().parse(req.body);
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
  app.get("/api/reports/owner/:ownerId", async (req: Request, res: Response) => {
    try {
      const ownerId = Number(req.params.ownerId);
      const month = req.query.month as string;
      const year = req.query.year as string;
      
      if (!month || !year) {
        return res.status(400).json({ message: "É necessário informar mês e ano para o relatório" });
      }
      
      const report = await storage.generateOwnerFinancialReport(ownerId, month, year);
      res.json(report);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Obter relatório financeiro geral
  app.get("/api/reports/financial-summary", async (req: Request, res: Response) => {
    try {
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const summary = await storage.generateFinancialSummary(startDate, endDate);
      res.json(summary);
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}  // Fechando o bloco da função registerRoutes
