/**
 * Script para testar a geração de PDF de orçamentos
 * Este script tenta criar um orçamento e gerar um PDF a partir dele
 */

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');

/**
 * Função que simula a geração de um PDF de orçamento
 * similar à implementação em PgStorage
 */
function generateQuotationPdf(quotation) {
  try {
    console.log("Gerando PDF para orçamento de teste:", quotation);
    
    // Criar nova instância do PDF
    const doc = new jsPDF();
    
    // Adicionar cabeçalho
    doc.setFontSize(20);
    doc.text("Maria Faz - Orçamento de Serviço", 105, 20, { align: 'center' });
    
    // Adicionar informações do cliente
    doc.setFontSize(12);
    doc.text("Informações do Cliente:", 14, 40);
    doc.setFontSize(10);
    doc.text(`Nome: ${quotation.clientName}`, 14, 50);
    doc.text(`Email: ${quotation.clientEmail}`, 14, 55);
    doc.text(`Telefone: ${quotation.clientPhone}`, 14, 60);
    
    // Adicionar detalhes da propriedade
    doc.setFontSize(12);
    doc.text("Detalhes da Propriedade:", 14, 75);
    doc.setFontSize(10);
    doc.text(`Tipo: ${quotation.propertyType}`, 14, 85);
    doc.text(`Área Total: ${quotation.totalArea} m²`, 14, 90);
    doc.text(`Quartos: ${quotation.bedrooms}`, 14, 95);
    doc.text(`Banheiros: ${quotation.bathrooms}`, 14, 100);
    
    // Características adicionais
    let yPos = 105;
    if (quotation.hasExteriorSpace) {
      doc.text(`Área Externa: ${quotation.exteriorArea} m²`, 14, yPos);
      yPos += 5;
    }
    if (quotation.isDuplex) {
      doc.text("Propriedade Duplex", 14, yPos);
      yPos += 5;
    }
    if (quotation.hasBBQ) {
      doc.text("Inclui Churrasqueira", 14, yPos);
      yPos += 5;
    }
    if (quotation.hasGarden) {
      doc.text("Inclui Jardim", 14, yPos);
      yPos += 5;
    }
    if (quotation.hasGlassSurfaces) {
      doc.text("Inclui Superfícies de Vidro", 14, yPos);
      yPos += 5;
    }
    
    // Adicionar tabela de preços
    yPos += 10;
    doc.setFontSize(12);
    doc.text("Detalhes do Preço:", 14, yPos);
    yPos += 10;
    
    const tableData = [
      ["Descrição", "Valor (€)"],
      ["Serviço Base", quotation.basePrice.toFixed(2)],
      ["Serviços Adicionais", quotation.additionalPrice.toFixed(2)],
      ["Total", quotation.totalPrice.toFixed(2)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: [60, 130, 200],
        textColor: 255
      },
      styles: {
        fontSize: 10
      }
    });
    
    // Adicionar notas
    if (quotation.notes) {
      yPos = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text("Observações:", 14, yPos);
      
      // Quebrar notas em linhas para evitar overflow
      const notesLines = doc.splitTextToSize(quotation.notes, 180);
      doc.setFontSize(10);
      doc.text(notesLines, 14, yPos + 10);
    }
    
    // Adicionar data de validade
    const validUntil = new Date(quotation.validUntil);
    const formattedDate = validUntil.toLocaleDateString('pt-PT');
    yPos = doc.internal.pageSize.height - 30;
    doc.setFontSize(10);
    doc.text(`Este orçamento é válido até: ${formattedDate}`, 14, yPos);
    
    // Adicionar rodapé
    doc.setFontSize(8);
    doc.text("Maria Faz - Gestão de Propriedades", 105, doc.internal.pageSize.height - 10, { align: 'center' });
    
    // Criar diretório de uploads se não existir
    const uploadDir = path.join('.', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Definir nome do arquivo e salvar
    const fileName = `orcamento_teste_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    
    // Salvar o PDF como um arquivo físico
    fs.writeFileSync(filePath, doc.output());
    
    console.log(`PDF gerado com sucesso: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}

/**
 * Função principal para testar a geração de PDF
 */
async function testQuotationPdf() {
  try {
    // Exemplo de dados de orçamento
    const quotationData = {
      id: 1,
      clientName: "João Silva",
      clientEmail: "joao.silva@exemplo.com",
      clientPhone: "+351912345678",
      propertyType: "apartment",
      totalArea: 85,
      bedrooms: 2,
      bathrooms: 1,
      hasExteriorSpace: true,
      exteriorArea: 15,
      isDuplex: false,
      hasBBQ: false,
      hasGarden: true,
      hasGlassSurfaces: true,
      basePrice: 350.00,
      additionalPrice: 75.00,
      totalPrice: 425.00,
      status: "draft",
      validUntil: "2025-04-25",
      notes: "Orçamento para limpeza profunda após renovação do apartamento. Inclui limpeza de janelas e tratamento do jardim."
    };
    
    // Gerar o PDF
    const filePath = generateQuotationPdf(quotationData);
    
    console.log("Teste concluído com sucesso!");
    console.log(`O PDF foi gerado em: ${filePath}`);
  } catch (error) {
    console.error("Erro ao executar o teste:", error);
  }
}

// Executar o teste
testQuotationPdf();