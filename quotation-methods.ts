import { type Quotation, type InsertQuotation } from "@shared/schema";

/**
 * Métodos para implementar na classe MemStorage
 * para suportar o sistema de orçamentos
 */

// Adicionar na declaração da classe:
// private quotationsMap: Map<number, Quotation>;
// currentQuotationId: number;

// Adicionar no construtor:
// this.quotationsMap = new Map();
// this.currentQuotationId = 1;

// Implementações dos métodos:

async function getQuotations(
  this: any,
  options?: {
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Quotation[]> {
  let quotations = Array.from(this.quotationsMap.values());
  
  // Aplicar filtros se houver opções
  if (options) {
    if (options.status) {
      quotations = quotations.filter(q => q.status === options.status);
    }
    if (options.startDate) {
      quotations = quotations.filter(q => new Date(q.createdAt) >= options.startDate!);
    }
    if (options.endDate) {
      quotations = quotations.filter(q => new Date(q.createdAt) <= options.endDate!);
    }
  }
  
  // Ordenar por data decrescente (mais recente primeiro)
  quotations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return quotations;
}

async function getQuotation(this: any, id: number): Promise<Quotation | undefined> {
  return this.quotationsMap.get(id);
}

async function createQuotation(this: any, quotation: InsertQuotation): Promise<Quotation> {
  const id = this.currentQuotationId++;
  const now = new Date();
  
  // Criar o orçamento com valores padrão para campos opcionais
  const newQuotation: Quotation = {
    ...quotation,
    id,
    createdAt: now,
    updatedAt: now
  };
  
  this.quotationsMap.set(id, newQuotation);
  
  // Registrar atividade
  this.createActivity({
    type: "quotation_created",
    description: `Orçamento para ${newQuotation.clientName} foi criado`,
    entityId: id,
    entityType: "quotation"
  });
  
  return newQuotation;
}

async function updateQuotation(this: any, id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
  const existingQuotation = this.quotationsMap.get(id);
  if (!existingQuotation) return undefined;
  
  // Atualizar o orçamento
  const updatedQuotation = {
    ...existingQuotation,
    ...quotation,
    updatedAt: new Date()
  };
  
  this.quotationsMap.set(id, updatedQuotation);
  
  // Registrar atividade
  this.createActivity({
    type: "quotation_updated",
    description: `Orçamento para ${updatedQuotation.clientName} foi atualizado`,
    entityId: id,
    entityType: "quotation"
  });
  
  return updatedQuotation;
}

async function deleteQuotation(this: any, id: number): Promise<boolean> {
  const quotation = this.quotationsMap.get(id);
  if (!quotation) return false;
  
  // Excluir o orçamento
  const result = this.quotationsMap.delete(id);
  
  // Registrar atividade
  if (result) {
    this.createActivity({
      type: "quotation_deleted",
      description: `Orçamento para ${quotation.clientName} foi excluído`,
      entityId: id,
      entityType: "quotation"
    });
  }
  
  return result;
}

async function generateQuotationPdf(this: any, id: number): Promise<string> {
  const quotation = await this.getQuotation(id);
  if (!quotation) throw new Error("Orçamento não encontrado");
  
  // Gerar nome de arquivo baseado no ID e data de criação
  const fileName = `quotation_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
  const filePath = `./uploads/${fileName}`;
  
  // Simulação: em ambiente real, aqui seria gerado o PDF
  // utilizando uma biblioteca como jsPDF ou PDF-lib
  
  return filePath;
}

export {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  generateQuotationPdf
};