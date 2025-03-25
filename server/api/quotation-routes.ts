import { Request, Response } from "express";
import { extendedQuotationSchema, insertQuotationSchema } from "@shared/schema";
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
      
      return res.json({
        success: true,
        data: quotations
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
      
      return res.json({
        success: true,
        data: quotation
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
      const validationResult = extendedQuotationSchema.safeParse(req.body);
      
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
      const updateSchema = extendedQuotationSchema.partial();
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
}