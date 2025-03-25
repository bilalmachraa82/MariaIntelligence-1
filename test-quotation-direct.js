/**
 * Teste direto para diagnóstico do problema de envio de orçamentos
 * Este script acessa diretamente o storage para criar um orçamento
 */

// Importar bibliotecas necessárias
import { insertQuotationSchema } from './shared/schema.js';

// Importações para CommonJS
const { db } = await import('./server/db.js');
const { getStorage } = await import('./server/storage.js');

async function testQuotationSubmit() {
  console.log('=== TESTE DIRETO DE CRIAÇÃO DE ORÇAMENTO ===');
  
  // Obter instância de armazenamento
  const storage = getStorage();
  
  // Dados simplificados mas completos para o orçamento
  const quotationData = {
    // Informações do cliente (obrigatórias)
    clientName: "João Silva Teste",
    clientEmail: "joao.silva@teste.com",
    clientPhone: "912345678",
    
    // Propriedade (obrigatórias)
    propertyType: "apartment_t2",
    propertyAddress: "Rua Exemplo, 123, Lisboa",
    propertyArea: 75,
    exteriorArea: 10,
    
    // Características (opcionais, mas com valores explícitos)
    isDuplex: false,
    hasBBQ: true,
    hasGlassGarden: false,
    
    // Preços (obrigatórios)
    basePrice: "30",
    duplexSurcharge: "0",
    bbqSurcharge: "30",
    exteriorSurcharge: "0",
    glassGardenSurcharge: "0",
    additionalSurcharges: "30",
    totalPrice: "60",
    
    // Detalhes adicionais (opcionais)
    validUntil: "2025-05-25",
    notes: "Teste de envio de orçamento via script de diagnóstico",
    internalNotes: "Teste automático",
    
    // Status (obrigatório)
    status: "draft"
  };
  
  console.log('Dados a serem enviados:', JSON.stringify(quotationData, null, 2));
  
  try {
    // Validar dados
    console.log('Validando dados com schema...');
    const validationResult = insertQuotationSchema.safeParse(quotationData);
    
    if (!validationResult.success) {
      console.error('❌ ERRO DE VALIDAÇÃO:');
      console.error(JSON.stringify(validationResult.error.format(), null, 2));
      
      // Detalhar campos com problemas
      console.error('Campos com problemas:');
      validationResult.error.errors.forEach(err => {
        console.error(`- Campo: ${err.path.join('.')}, Erro: ${err.message}`);
      });
      
      return;
    }
    
    console.log('✓ Dados validados com sucesso!');
    console.log('Criando orçamento...');
    
    // Criar orçamento diretamente
    const newQuotation = await storage.createQuotation(quotationData);
    
    console.log('✅ SUCESSO: Orçamento criado com ID', newQuotation.id);
    console.log('Orçamento criado:', JSON.stringify(newQuotation, null, 2));
    
  } catch (error) {
    console.error('❌ ERRO AO CRIAR ORÇAMENTO:', error);
    
    // Se for um erro do PostgreSQL, mostrar detalhes
    if (error.code) {
      console.error(`Código PostgreSQL: ${error.code}`);
      console.error(`Detalhe: ${error.detail || 'Sem detalhes'}`);
      console.error(`Tabela: ${error.table || 'Desconhecida'}`);
      console.error(`Constraint: ${error.constraint || 'Desconhecida'}`);
    }
  }
}

// Executar o teste
testQuotationSubmit();