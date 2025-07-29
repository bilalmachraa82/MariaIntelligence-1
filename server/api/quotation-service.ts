import { storage } from "../storage";
import { type Quotation, type InsertQuotation } from "@shared/schema";

/**
 * Serviço para gerenciamento de orçamentos
 * Implementa operações CRUD para orçamentos
 */
export class QuotationService {
  /**
   * Busca todos os orçamentos com filtros opcionais
   * @param options Opções de filtro (status, datas)
   * @returns Lista de orçamentos
   */
  async getQuotations(options?: {
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    startDate?: Date;
    endDate?: Date;
  }): Promise<Quotation[]> {
    return storage.getQuotations(options);
  }

  /**
   * Busca um orçamento específico por ID
   * @param id ID do orçamento
   * @returns Orçamento encontrado ou undefined
   */
  async getQuotation(id: number): Promise<Quotation | undefined> {
    return storage.getQuotation(id);
  }

  /**
   * Cria um novo orçamento
   * @param quotation Dados do novo orçamento
   * @returns Orçamento criado
   */
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    return storage.createQuotation(quotation);
  }

  /**
   * Atualiza um orçamento existente
   * @param id ID do orçamento
   * @param quotation Dados parciais para atualização
   * @returns Orçamento atualizado ou undefined se não encontrado
   */
  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    return storage.updateQuotation(id, quotation);
  }

  /**
   * Exclui um orçamento
   * @param id ID do orçamento
   * @returns Booleano indicando sucesso da exclusão
   */
  async deleteQuotation(id: number): Promise<boolean> {
    return storage.deleteQuotation(id);
  }

  /**
   * Gera um PDF do orçamento
   * @param id ID do orçamento
   * @returns Caminho do arquivo PDF gerado
   */
  async generateQuotationPdf(id: number): Promise<string> {
    return storage.generateQuotationPdf(id);
  }
}

// Instância singleton do serviço de orçamentos
export const quotationService = new QuotationService();