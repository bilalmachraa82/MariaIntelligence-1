/**
 * Script para simular a criação de um orçamento e obtenção do PDF
 * Este script pula a etapa de criação no banco de dados e gera diretamente o PDF
 */

import fs from 'fs';
import path from 'path';
import { pdfService } from './server/services/pdf.service';

async function simularOrcamento() {
  console.log("=== SIMULAÇÃO DE ORÇAMENTO ===");
  console.log("Preparando dados de orçamento para teste...");
  
  try {
    // Criar um orçamento simulado para teste (sem salvar no banco de dados)
    const orcamentoSimulado = {
      id: 9999, // ID fictício apenas para a geração do PDF
      clientName: "Família Silva",
      clientEmail: "familia.silva@exemplo.pt",
      clientPhone: "+351 910 123 456",
      propertyType: "Apartamento T3 com Terraço",
      propertyArea: 150,
      exteriorArea: 35,
      isDuplex: true,
      hasBBQ: true,
      hasGlassGarden: false,
      basePrice: 300,
      duplexSurcharge: 80,
      bbqSurcharge: 40,
      exteriorSurcharge: 30,
      glassGardenSurcharge: 0,
      additionalSurcharges: 25,
      totalPrice: 475,
      notes: "Cliente solicitou atenção especial para a área exterior e limpeza da churrasqueira. Foi aplicado desconto de fidelidade. Disponibilidade para realizar o serviço nos finais de semana.",
      status: "sent",
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias no futuro
    };
    
    console.log("Dados de teste preparados, gerando PDF diretamente...");
    
    console.log(`Orçamento simulado preparado! ID (simulado): ${orcamentoSimulado.id}`);
    console.log("Detalhes do orçamento:", JSON.stringify(orcamentoSimulado, null, 2));
    
    // 2. Gerar o PDF do orçamento
    console.log(`Gerando PDF para o orçamento simulado #${orcamentoSimulado.id}...`);
    const pdfPath = await pdfService.generateQuotationPdf(orcamentoSimulado, orcamentoSimulado.id);
    
    console.log(`PDF gerado com sucesso em: ${pdfPath}`);
    
    // 3. Verificar se o arquivo foi criado
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`Arquivo PDF verificado: ${pdfPath} (${stats.size} bytes)`);
      
      // 4. Copiar o PDF para um local mais acessível com nome mais descritivo
      const nomeSaida = `orcamento_familia_silva_${orcamentoSimulado.id}.pdf`;
      const destinoFinal = path.join('.', nomeSaida);
      fs.copyFileSync(pdfPath, destinoFinal);
      
      console.log(`PDF copiado para: ${destinoFinal} para fácil acesso`);
      
      return {
        success: true,
        message: `Simulação completa! Orçamento simulado #${orcamentoSimulado.id} e PDF gerado.`,
        orcamento: orcamentoSimulado,
        pdfPath: destinoFinal
      };
    } else {
      throw new Error(`PDF não encontrado no caminho esperado: ${pdfPath}`);
    }
  } catch (error: any) {
    console.error("Erro durante a simulação:", error);
    return {
      success: false,
      message: `Erro: ${error.message}`,
      error
    };
  }
}

// Executar a simulação
simularOrcamento()
  .then(result => {
    console.log("\n=== RESULTADO DA SIMULAÇÃO ===");
    console.log(`Status: ${result.success ? 'SUCESSO ✅' : 'FALHA ❌'}`);
    console.log(`Mensagem: ${result.message}`);
    
    if (result.success) {
      console.log("\nO PDF do orçamento foi gerado com sucesso!");
      console.log(`Você pode encontrar o arquivo em: ${result.pdfPath}`);
      console.log("Para visualizar, faça download do arquivo PDF.");
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error("Erro fatal:", err);
    process.exit(1);
  });