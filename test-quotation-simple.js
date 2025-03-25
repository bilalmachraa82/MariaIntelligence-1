/**
 * Teste simplificado para verificar a validação do schema de orçamentos
 * Este script não cria orçamentos, apenas valida os dados
 */

// Importar Zod para validação
const { z } = require('zod');

// Criar um schema simplificado para testar
const quotationSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientEmail: z.string().email("Email inválido").optional().nullable(),
  clientPhone: z.string().optional().nullable(),
  
  propertyType: z.enum([
    "apartment_t0t1", "apartment_t2", "apartment_t3", "apartment_t4", "apartment_t5",
    "house_v1", "house_v2", "house_v3", "house_v4", "house_v5"
  ], {
    errorMap: () => ({ message: "Tipo de propriedade inválido" })
  }),
  
  propertyAddress: z.string().optional().nullable(),
  propertyArea: z.number().min(1, "Área deve ser maior que 0"),
  exteriorArea: z.number().min(0, "Área exterior não pode ser negativa").optional().nullable(),
  
  isDuplex: z.boolean().optional().nullable(),
  hasBBQ: z.boolean().optional().nullable(),
  hasGlassGarden: z.boolean().optional().nullable(),
  
  basePrice: z.string().or(z.number()),
  duplexSurcharge: z.string().or(z.number()).optional().nullable(),
  bbqSurcharge: z.string().or(z.number()).optional().nullable(),
  exteriorSurcharge: z.string().or(z.number()).optional().nullable(),
  glassGardenSurcharge: z.string().or(z.number()).optional().nullable(),
  additionalSurcharges: z.string().or(z.number()).optional().nullable(),
  totalPrice: z.string().or(z.number()),
  
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"], {
    errorMap: () => ({ message: "Status inválido" })
  })
});

function testQuotationValidation() {
  console.log('=== TESTE SIMPLES DE VALIDAÇÃO DE ORÇAMENTO ===');
  
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
  
  console.log('Dados a serem validados:', JSON.stringify(quotationData, null, 2));
  
  try {
    // Validar dados
    console.log('Validando dados com schema...');
    const validationResult = quotationSchema.safeParse(quotationData);
    
    if (!validationResult.success) {
      console.error('❌ ERRO DE VALIDAÇÃO:');
      console.error(JSON.stringify(validationResult.error.format(), null, 2));
      
      console.error('Campos com problemas:');
      validationResult.error.errors.forEach(err => {
        console.error(`- Campo: ${err.path.join('.')}, Erro: ${err.message}`);
      });
      
      return;
    }
    
    console.log('✅ SUCESSO: Dados validados corretamente');
    console.log('Dados validados:', JSON.stringify(validationResult.data, null, 2));
    
  } catch (error) {
    console.error('❌ ERRO DE EXECUÇÃO:', error);
  }
}

// Executar o teste
testQuotationValidation();