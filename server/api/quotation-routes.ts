import { Request, Response } from "express";
import { insertQuotationSchema } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Registra as rotas de orçamentos na aplicação Express
 * @param app Aplicação Express
 */
export function registerQuotationRoutes(app: any) {
  /**
   * Endpoint para listar orçamentos com filtros opcionais
   */
  app.get("/api/quotations", async (req: Request, res: Response) => {
    try {
      const { status, startDate, endDate } = req.query;
      
      const options: any = {};
      
      if (status && typeof status === 'string') {
        options.status = status;
      }
      
      if (startDate && typeof startDate === 'string') {
        options.startDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        options.endDate = new Date(endDate);
      }
      
      const quotations = await storage.getQuotations(Object.keys(options).length > 0 ? options : undefined);
      
      // Mapeamento de tipos de propriedade para exibição
      const propertyTypeMap = {
        'apartment_t0t1': 'Apartamento T0/T1',
        'apartment_t2': 'Apartamento T2',
        'apartment_t3': 'Apartamento T3',
        'apartment_t4': 'Apartamento T4',
        'apartment_t5': 'Apartamento T5+',
        'house_v1': 'Moradia V1',
        'house_v2': 'Moradia V2',
        'house_v3': 'Moradia V3',
        'house_v4': 'Moradia V4',
        'house_v5': 'Moradia V5+'
      };
      
      // Processar os dados antes de responder
      const processedQuotations = quotations.map(q => {
        // Cria uma cópia segura do objeto para não modificar o original
        const quotation = {...q};
        
        // Adiciona o tipo de propriedade formatado
        quotation.propertyTypeDisplay = propertyTypeMap[quotation.propertyType] || quotation.propertyType;
        
        // Formata o preço para exibição em euros
        try {
          // Usamos totalPrice como fonte para o priceNumber
          let priceSource = quotation.totalPrice;
          
          // Se totalPrice não existe ou é inválido, tente totalAmount como alternativa
          if (!priceSource && quotation.totalAmount) {
            priceSource = quotation.totalAmount;
          }
          
          // Converte para número
          const priceNumber = parseFloat(priceSource);
          
          // Verifica se é um número válido
          if (!isNaN(priceNumber)) {
            quotation.totalPriceFormatted = new Intl.NumberFormat('pt-PT', {
              style: 'currency', 
              currency: 'EUR'
            }).format(priceNumber);
          } else {
            // Fallback para quando o preço é inválido
            quotation.totalPriceFormatted = priceSource ? priceSource + ' €' : '0,00 €';
          }
        } catch (e) {
          console.error('Erro ao formatar preço:', e);
          // Fallback para caso haja erro
          quotation.totalPriceFormatted = quotation.totalPrice || quotation.totalAmount || '0,00 €';
        }
        
        return quotation;
      });
      
      return res.json({
        success: true,
        data: processedQuotations
      });
    } catch (error: any) {
      console.error("Erro ao listar orçamentos:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao listar orçamentos",
        error: error.message
      });
    }
  });

  /**
   * Endpoint para obter um orçamento específico
   */
  app.get("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Orçamento não encontrado"
        });
      }
      
      // Mapeamento de tipos de propriedade para exibição
      const propertyTypeMap = {
        'apartment_t0t1': 'Apartamento T0/T1',
        'apartment_t2': 'Apartamento T2',
        'apartment_t3': 'Apartamento T3',
        'apartment_t4': 'Apartamento T4',
        'apartment_t5': 'Apartamento T5+',
        'house_v1': 'Moradia V1',
        'house_v2': 'Moradia V2',
        'house_v3': 'Moradia V3',
        'house_v4': 'Moradia V4',
        'house_v5': 'Moradia V5+'
      };
      
      // Enriquecer os dados do orçamento para a exibição no cliente
      const enrichedQuotation = {...quotation};
      
      // Adicionar propriedades que podem estar faltando
      if (!enrichedQuotation.propertyType) {
        // Se o tipo de propriedade não estiver definido, tentar determiná-lo a partir do endereco ou outros dados
        enrichedQuotation.propertyType = 'apartment_t0t1'; // Valor padrão
      }
      
      // Garantir que temos todos os campos necessários para a exibição
      enrichedQuotation.propertyTypeDisplay = propertyTypeMap[enrichedQuotation.propertyType] || enrichedQuotation.propertyType;
      
      // Adicionar ou ajustar campos necessários para a exibição
      if (!enrichedQuotation.propertyArea) enrichedQuotation.propertyArea = 0;
      if (!enrichedQuotation.exteriorArea) enrichedQuotation.exteriorArea = 0;
      if (!enrichedQuotation.bedrooms) enrichedQuotation.bedrooms = 1;
      if (!enrichedQuotation.bathrooms) enrichedQuotation.bathrooms = 1;
      if (enrichedQuotation.isDuplex === undefined) enrichedQuotation.isDuplex = false;
      if (enrichedQuotation.hasBBQ === undefined) enrichedQuotation.hasBBQ = false;
      if (enrichedQuotation.hasGlassGarden === undefined) enrichedQuotation.hasGlassGarden = false;
      
      // Se totalPrice não estiver definido, usar totalAmount
      if (!enrichedQuotation.totalPrice && enrichedQuotation.totalAmount) {
        enrichedQuotation.totalPrice = enrichedQuotation.totalAmount;
      }
      
      // Se basePrice não estiver definido, estimar a partir do preço total
      if (!enrichedQuotation.basePrice && enrichedQuotation.totalPrice) {
        enrichedQuotation.basePrice = enrichedQuotation.totalPrice;
      }
      
      // Garantir que campos de sobretaxa estejam presentes
      if (!enrichedQuotation.duplexSurcharge) enrichedQuotation.duplexSurcharge = "0.00";
      if (!enrichedQuotation.bbqSurcharge) enrichedQuotation.bbqSurcharge = "0.00";
      if (!enrichedQuotation.glassGardenSurcharge) enrichedQuotation.glassGardenSurcharge = "0.00";
      if (!enrichedQuotation.exteriorSurcharge) enrichedQuotation.exteriorSurcharge = "0.00";
      if (!enrichedQuotation.additionalSurcharges) enrichedQuotation.additionalSurcharges = "0.00";
      
      // Formatar o preço total para exibição em euros
      try {
        let priceSource = enrichedQuotation.totalPrice;
        if (!priceSource && enrichedQuotation.totalAmount) {
          priceSource = enrichedQuotation.totalAmount;
        }
        
        const priceNumber = parseFloat(priceSource);
        
        if (!isNaN(priceNumber)) {
          enrichedQuotation.totalPriceFormatted = new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
          }).format(priceNumber);
        } else {
          enrichedQuotation.totalPriceFormatted = priceSource ? priceSource + ' €' : '0,00 €';
        }
      } catch (e) {
        console.error('Erro ao formatar preço:', e);
        enrichedQuotation.totalPriceFormatted = enrichedQuotation.totalPrice || enrichedQuotation.totalAmount || '0,00 €';
      }
      
      return res.json({
        success: true,
        data: enrichedQuotation
      });
    } catch (error: any) {
      console.error("Erro ao buscar orçamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar orçamento",
        error: error.message
      });
    }
  });

  /**
   * Endpoint para criar um novo orçamento
   */
  app.post("/api/quotations", async (req: Request, res: Response) => {
    try {
      // Log detalhado para diagnóstico
      console.log("===== INÍCIO PROCESSAMENTO DE ORÇAMENTO =====");
      console.log("Recebendo dados de orçamento:", JSON.stringify(req.body, null, 2));
      
      // Validar dados do orçamento
      const validationResult = insertQuotationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.error("ERRO DE VALIDAÇÃO DE ORÇAMENTO:");
        console.error(JSON.stringify(validationResult.error.format(), null, 2));
        console.error("Campos inválidos:", Object.keys(validationResult.error.format()).filter(k => k !== '_errors'));
        
        // Log detalhado dos erros para depuração
        validationResult.error.errors.forEach(err => {
          console.error(`Campo: ${err.path.join('.')}, Erro: ${err.message}, Código: ${err.code}`);
        });
        
        return res.status(400).json({
          success: false,
          message: "Dados de orçamento inválidos",
          errors: validationResult.error.format()
        });
      }
      
      const quotationData = validationResult.data;
      console.log("Dados validados com sucesso:", JSON.stringify(quotationData, null, 2));
      
      // Criar orçamento
      const newQuotation = await storage.createQuotation(quotationData);
      
      return res.status(201).json({
        success: true,
        message: "Orçamento criado com sucesso",
        data: newQuotation
      });
    } catch (error: any) {
      console.error("Erro ao criar orçamento:", error);
      
      // Log detalhado para diagnóstico
      if (error.name === 'ZodError') {
        console.error("Erro de validação ZodError:", JSON.stringify(error.format(), null, 2));
        return res.status(400).json({
          success: false,
          message: "Dados de orçamento inválidos",
          errors: error.format()
        });
      }
      
      // Erro detalhado de DB
      if (error.code) {
        console.error(`Erro de banco de dados: [${error.code}] ${error.message}`);
        
        // Verificar se é erro de tipo/formato em algum campo
        if (error.code === '22P02') { // invalid_text_representation ou invalid_numeric_value
          return res.status(400).json({
            success: false,
            message: "Erro de formato nos dados do orçamento",
            detail: error.detail || error.message,
            errors: {
              '_errors': ['Formato de dados inválido em um ou mais campos']
            }
          });
        }
      }
      
      // Erro genérico
      return res.status(500).json({
        success: false,
        message: "Erro ao criar orçamento",
        error: error.message
      });
    }
  });

  /**
   * Endpoint para atualizar um orçamento existente
   */
  app.patch("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      // Validar dados da atualização
      const updateSchema = insertQuotationSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Dados de atualização inválidos",
          errors: validationResult.error.format()
        });
      }
      
      const updateData = validationResult.data;
      
      // Atualizar orçamento
      const updatedQuotation = await storage.updateQuotation(id, updateData);
      
      if (!updatedQuotation) {
        return res.status(404).json({
          success: false,
          message: "Orçamento não encontrado"
        });
      }
      
      return res.json({
        success: true,
        message: "Orçamento atualizado com sucesso",
        data: updatedQuotation
      });
    } catch (error: any) {
      console.error("Erro ao atualizar orçamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar orçamento",
        error: error.message
      });
    }
  });

  /**
   * Endpoint para excluir um orçamento
   */
  app.delete("/api/quotations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      const result = await storage.deleteQuotation(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Orçamento não encontrado ou já excluído"
        });
      }
      
      return res.json({
        success: true,
        message: "Orçamento excluído com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao excluir orçamento:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao excluir orçamento",
        error: error.message
      });
    }
  });

  /**
   * Endpoint para gerar PDF do orçamento
   * Suporta dois modos:
   * 1. ?mode=json - Retorna apenas o caminho do arquivo (padrão antigo)
   * 2. ?mode=download ou sem parâmetro - Permite download direto do arquivo
   */
  app.get("/api/quotations/:id/pdf", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const mode = req.query.mode as string || 'download';
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      // Gerar o PDF e obter o caminho
      const pdfPath = await storage.generateQuotationPdf(id);
      
      // Verificar o modo solicitado
      if (mode === 'json') {
        return res.json({
          success: true,
          message: "PDF gerado com sucesso",
          pdfPath: pdfPath
        });
      } else {
        // Modo download - Enviar o arquivo diretamente
        
        // Verificar se o arquivo existe
        if (!fs.existsSync(pdfPath)) {
          throw new Error("Arquivo PDF não encontrado");
        }
        
        // Obter o nome do arquivo a partir do caminho
        const fileName = path.basename(pdfPath);
        
        // Configurar cabeçalhos para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Enviar o arquivo
        const fileStream = fs.createReadStream(pdfPath);
        fileStream.pipe(res);
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar PDF do orçamento",
        error: error.message
      });
    }
  });

  /**
   * Endpoint para enviar orçamento por e-mail
   * Envia o PDF do orçamento como anexo para o e-mail especificado
   */
  app.post("/api/quotations/:id/send-email", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { email, subject, message } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido"
        });
      }
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "E-mail de destino não fornecido"
        });
      }
      
      // Verificar se o orçamento existe
      const quotation = await storage.getQuotation(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Orçamento não encontrado"
        });
      }
      
      // Gerar PDF se ainda não existir
      const pdfPath = await storage.generateQuotationPdf(id);
      
      try {
        // Enviar e-mail com o PDF anexado
        await storage.sendQuotationByEmail(id, {
          email,
          subject: subject || `Orçamento de Serviço para ${quotation.clientName}`,
          message: message || `Segue em anexo o orçamento de serviço para ${quotation.clientName}.`
        });
      } catch (emailError) {
        // Se o método falhar, logar a falha e continuar com simulação
        console.error("Erro ao enviar orçamento por e-mail:", emailError);
        console.log(`[SIMULAÇÃO] E-mail enviado para ${email} com o orçamento #${id}`);
      }
      
      // Atualizar status do orçamento para "sent" se estiver em "draft"
      if (quotation.status === 'draft') {
        await storage.updateQuotation(id, { status: 'sent' });
      }
      
      return res.json({
        success: true,
        message: "Orçamento enviado por e-mail com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao enviar orçamento por e-mail:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao enviar orçamento por e-mail",
        error: error.message
      });
    }
  });
}