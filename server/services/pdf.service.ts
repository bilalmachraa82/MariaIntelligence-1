/**
 * Serviço dedicado para geração de PDFs no sistema Maria Faz
 * Fornece funcionalidades para criar PDFs para orçamentos, relatórios e outros documentos
 */

import fs from 'fs';
import path from 'path';
import { Quotation } from '@shared/schema';

// Importando os tipos diretamente da biblioteca é mais adequado, 
// mas para este caso simples vamos remover a definição de tipo personalizada
// e confiar nos tipos fornecidos pela própria biblioteca jsPDF

/**
 * Serviço para geração de PDF
 * Utiliza jsPDF e jspdf-autotable para criar documentos PDF bem formatados
 */
export class PDFService {
  /**
   * Gera um PDF de orçamento
   * @param quotation Dados do orçamento
   * @param id ID do orçamento
   * @returns Caminho para o arquivo PDF gerado
   */
  async generateQuotationPdf(quotation: any, id: number): Promise<string> {
    try {
      console.log("Iniciando geração de PDF para orçamento...");
      
      // Importação dinâmica para evitar problemas com o servidor
      const jsPDF = await import('jspdf').then(module => module.jsPDF);
      const autoTable = await import('jspdf-autotable').then(module => module.default);
      
      // Verificar se temos dados do orçamento
      if (!quotation) {
        console.error("Dados do orçamento não fornecidos");
        throw new Error("Dados do orçamento não fornecidos");
      }
      
      console.log("Orçamento encontrado, dados:", JSON.stringify(quotation, null, 2));
      
      // Criar diretório de uploads se não existir
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        console.log("Criando diretório de uploads:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Gerar nome de arquivo baseado no ID e data de criação
      const timestamp = Date.now();
      const fileName = `orcamento_${id}_${timestamp}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      
      console.log(`Gerando PDF para orçamento #${id} em ${filePath}`);
      
      // Criar uma nova instância de PDF (formato A4)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar metadados ao documento
      doc.setProperties({
        title: `Orçamento Maria Faz Nº ${id}`,
        subject: `Orçamento para ${quotation.clientName}`,
        author: 'Maria Faz',
        creator: 'Sistema Maria Faz'
      });
      
      // Estilo do documento - usando fontes e cores alinhadas com o logo Maria Faz
      doc.setFont('helvetica', 'normal');
      
      // Cores do logo: 
      // Rosa: rgb(231, 144, 144) - #E79090
      // Rosa claro: rgb(245, 213, 213) - #F5D5D5
      // Turquesa: rgb(142, 209, 210) - #8ED1D2
      
      // Carregar o logo a partir do arquivo
      try {
        const logoData = fs.readFileSync('./attached_assets/logo.png');
        const base64Logo = 'data:image/png;base64,' + logoData.toString('base64');
        
        // Adicionar o logo com proporções corretas (mantendo a proporção original)
        // Tamanho ajustado para ser menor e mais proporcional
        doc.addImage(base64Logo, 'PNG', 75, 10, 60, 17);
      } catch (error) {
        console.error("Erro ao carregar o logo:", error);
        // Em caso de erro ao carregar o logo, apenas usar texto como fallback
        doc.setFontSize(24);
        doc.setTextColor(0, 0, 0);
        doc.text('Maria Faz', 105, 20, { align: 'center' });
      }
      
      // Título - usando a cor turquesa do logo
      doc.setFontSize(20);
      doc.setTextColor(142, 209, 210); // Turquesa
      doc.text('ORÇAMENTO DE SERVIÇOS', 105, 40, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Voltar para preto
      
      // Informações do orçamento
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Orçamento Nº: ${id}`, 20, 50);
      
      // Data do orçamento e validade
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-PT');
      };
      
      const createdDate = quotation.createdAt ? formatDate(quotation.createdAt) : formatDate(new Date().toISOString());
      doc.text(`Data: ${createdDate}`, 20, 57);
      doc.text(`Válido até: ${formatDate(quotation.validUntil)}`, 20, 64);
      
      // Informações do cliente
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      // Título de seção em rosa
      doc.setTextColor(231, 144, 144); // Rosa
      doc.text('Dados do Cliente', 20, 75);
      doc.setTextColor(0, 0, 0); // Voltar para preto
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${quotation.clientName}`, 20, 83);
      
      if (quotation.clientEmail) {
        doc.text(`Email: ${quotation.clientEmail}`, 20, 90);
      }
      
      if (quotation.clientPhone) {
        doc.text(`Telefone: ${quotation.clientPhone}`, 20, 97);
      }
      
      // Informações da propriedade
      let currentY = 110;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      // Título de seção em rosa claro
      doc.setTextColor(245, 213, 213); // Rosa claro
      doc.text('Detalhes da Propriedade', 20, currentY);
      doc.setTextColor(0, 0, 0); // Voltar para preto
      currentY += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Tabela com os detalhes da propriedade
      const propertyDetails = [
        ['Tipo', quotation.propertyType || 'Não especificado'],
        ['Área Total', `${quotation.propertyArea || 0} m²`]
      ];
      
      if (quotation.exteriorArea > 0) {
        propertyDetails.push(['Área Exterior', `${quotation.exteriorArea} m²`]);
      }
      
      autoTable(doc, {
        startY: currentY,
        head: [['Característica', 'Detalhe']],
        body: propertyDetails,
        theme: 'striped',
        headStyles: { fillColor: [231, 144, 144], textColor: [255, 255, 255] }, // Rosa para o cabeçalho
        margin: { top: 20, left: 20, right: 20 }
      });
      
      // @ts-ignore - lastAutoTable é adicionado pelo plugin jspdf-autotable
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 30;
      
      // Características adicionais
      if (quotation.isDuplex || quotation.exteriorArea > 0 || quotation.hasBBQ || 
          quotation.hasGlassGarden) {
            
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(231, 144, 144); // Rosa
        doc.text('Características Adicionais:', 20, currentY);
        doc.setTextColor(0, 0, 0); // Voltar para preto
        currentY += 7;
        
        doc.setFont('helvetica', 'normal');
        const features = [];
        
        if (quotation.isDuplex) features.push('Duplex');
        if (quotation.exteriorArea > 0) features.push('Espaço Exterior');
        if (quotation.hasBBQ) features.push('Churrasqueira');
        if (quotation.hasGlassGarden) features.push('Jardim com Superfícies de Vidro');
        
        doc.setFontSize(10);
        features.forEach((feature, index) => {
          doc.text(`• ${feature}`, 25, currentY + (index * 6));
        });
        
        currentY += (features.length * 6) + 10;
      }
      
      // Valores do orçamento
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      // Título em turquesa
      doc.setTextColor(142, 209, 210); // Turquesa
      doc.text('Resumo do Orçamento', 105, currentY, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Voltar para preto
      currentY += 10;
      
      // Formatar valor monetário
      const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-PT', { 
          style: 'currency', 
          currency: 'EUR',
          minimumFractionDigits: 2
        });
      };
      
      // Calcular os valores corretamente
      const basePrice = parseFloat(quotation.basePrice?.toString() || "0");
      const duplexSurcharge = parseFloat(quotation.duplexSurcharge?.toString() || "0");
      const bbqSurcharge = parseFloat(quotation.bbqSurcharge?.toString() || "0");
      const exteriorSurcharge = parseFloat(quotation.exteriorSurcharge?.toString() || "0");
      const glassGardenSurcharge = parseFloat(quotation.glassGardenSurcharge?.toString() || "0");
      const additionalSurcharges = parseFloat(quotation.additionalSurcharges?.toString() || "0");
      
      const additionalTotal = (
        duplexSurcharge + 
        bbqSurcharge + 
        exteriorSurcharge + 
        glassGardenSurcharge + 
        additionalSurcharges
      );
      
      // Garantir que o total é a soma do preço base + adicionais
      const calculatedTotalPrice = basePrice + additionalTotal;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Valor']],
        body: [
          ['Preço Base', formatCurrency(basePrice)],
          ['Adicionais', formatCurrency(additionalTotal)],
          ['Preço Total', formatCurrency(calculatedTotalPrice)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [231, 144, 144], textColor: [255, 255, 255] }, // Rosa para o cabeçalho
        bodyStyles: { fontSize: 12 },
        columnStyles: { 1: { halign: 'right' } },
        margin: { top: 20, left: 40, right: 40 },
        foot: [['', '']],
        footStyles: { fillColor: [245, 213, 213] } // Rosa claro para o rodapé
      });
      
      // @ts-ignore - lastAutoTable é adicionado pelo plugin jspdf-autotable
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : currentY + 50;
      
      // Observações
      if (quotation.notes) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 213, 213); // Rosa claro
        doc.text('Observações:', 20, currentY);
        doc.setTextColor(0, 0, 0); // Voltar para preto
        currentY += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Dividir o texto em linhas para evitar que ultrapasse a largura da página
        const textLines = doc.splitTextToSize(quotation.notes, 170);
        doc.text(textLines as string[], 20, currentY);
        
        currentY += (textLines.length * 5) + 10;
      }
      
      // Frase inspiradora/call-to-action
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(142, 209, 210); // Turquesa
      const inspPhrase = "A Maria Faz tudo para tornar o seu espaço mais especial e valorizado!";
      doc.text(inspPhrase, 105, currentY + 5, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      const callToAction = "Reserve já o seu serviço e beneficie desta proposta especial!";
      doc.text(callToAction, 105, currentY + 12, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Voltar para preto
      
      // Garantir que há espaço suficiente para o rodapé
      const pageHeight = doc.internal.pageSize.height;
      
      // Verificar se o conteúdo está muito próximo do rodapé
      if (currentY > pageHeight - 60) {
        // Adicionar uma nova página se o conteúdo estiver muito próximo do rodapé
        doc.addPage();
        currentY = 20; // Resetar a posição Y para o topo da nova página
      }
      
      // Rodapé com informações da empresa - posicionado a partir do fim da página
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Posicionar o rodapé a partir do fim da página
      const footerY = pageHeight - 25; // 25mm a partir do fim da página
      
      doc.text('A MARIA FAZ, UNIPESSOAL, LDA | NIF: 517445271', 105, footerY - 15, { align: 'center' });
      doc.text('Conta: 4-6175941.000.001 | IBAN: PT50 0010 0000 61759410001 68', 105, footerY - 10, { align: 'center' });
      doc.text('BIC: BBPIPTPL | BANCO BPI', 105, footerY - 5, { align: 'center' });
      doc.text('Este orçamento é válido por 30 dias. Contacte-nos para mais informações.', 105, footerY, { align: 'center' });
      
      // Verificar se o diretório existe antes de salvar
      try {
        // Salvar o PDF no sistema de arquivos
        const pdfOutput = doc.output();
        fs.writeFileSync(filePath, pdfOutput, 'binary');
        console.log(`PDF gerado com sucesso em ${filePath}`);
      } catch (error) {
        console.error("Erro ao salvar o arquivo PDF:", error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao salvar o arquivo PDF: ${errorMessage}`);
      }
      
      return filePath;
    } catch (error) {
      console.error(`Erro ao gerar PDF para orçamento #${id}:`, error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "Erro sem stack trace");
      throw error;
    }
  }
}

// Exportar uma instância única do serviço
export const pdfService = new PDFService();