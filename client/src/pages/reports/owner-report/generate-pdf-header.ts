import { jsPDF } from 'jspdf';
import { LOGO_BASE64 } from '@/lib/pdf-logo-utils';

/**
 * Adiciona um cabeçalho padronizado com o logo do Maria Faz
 * 
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página em mm
 * @param brandColor Cor da marca em formato RGB array [r, g, b]
 */
export function addMariaFazHeader(
  doc: jsPDF,
  pageWidth: number,
  brandColor: number[] = [41, 121, 255]
): void {
  // Configurações do logo
  const logoWidth = 30; // largura do logo em mm
  const logoHeight = 15; // altura proporcional
  const logoPosX = pageWidth - logoWidth - 14; // posição X (margem direita)
  const logoPosY = 14; // posição Y (topo da página)
  
  // Adicionar o logo Maria Faz ao cabeçalho
  doc.addImage(
    LOGO_BASE64,
    'JPEG',
    logoPosX,
    logoPosY,
    logoWidth,
    logoHeight
  );
  
  // Linha decorativa abaixo do cabeçalho
  doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 22, pageWidth - 14, 22);
}

/**
 * Adiciona um rodapé padronizado para todas as páginas do PDF
 * 
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página em mm
 * @param pageHeight Altura da página em mm
 * @param confidentialText Texto de confidencialidade
 * @param currentPage Número da página atual
 * @param totalPages Total de páginas
 * @param poweredByText Texto "Powered by..."
 * @param showBankInfo Mostra informações bancárias (para PDFs de pagamento)
 */
export function addMariaFazFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  confidentialText: string = 'Documento Confidencial',
  currentPage: number = 1,
  totalPages: number = 1,
  poweredByText: string = 'Powered by Maria Faz',
  showBankInfo: boolean = true
): void {
  // Configurações do rodapé
  const footerY = pageHeight - 10;
  const margin = 14;
  
  // Adicionar informações bancárias se necessário (em documentos relacionados a pagamentos)
  if (showBankInfo) {
    // Linha adicional para as informações bancárias
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 18, pageWidth - margin, footerY - 18);
    
    // Informações bancárias
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text('A MARIA FAZ, UNIPESSOAL, LDA | NIF: 517445271', pageWidth / 2, footerY - 15, { align: 'center' });
    doc.text('Conta: 4-6175941.000.001 | IBAN: PT50 0010 0000 61759410001 68', pageWidth / 2, footerY - 12, { align: 'center' });
    doc.text('BIC: BBPIPTPL | BANCO BPI', pageWidth / 2, footerY - 9, { align: 'center' });
  }
  
  // Linha divisória acima do rodapé principal
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  
  // Texto de confidencialidade à esquerda
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(confidentialText, margin, footerY);
  
  // Numeração de página no centro
  const pageText = `${currentPage} / ${totalPages}`;
  doc.setFont('helvetica', 'normal');
  doc.text(pageText, pageWidth / 2, footerY, { align: 'center' });
  
  // Texto "Powered by" à direita
  doc.setFont('helvetica', 'bold');
  doc.text(poweredByText, pageWidth - margin, footerY, { align: 'right' });
  
  // Mini logo no rodapé (opcional)
  // Já implementado diretamente pela função principal de exportação
}