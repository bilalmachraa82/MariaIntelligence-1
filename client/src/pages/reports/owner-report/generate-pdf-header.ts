import { jsPDF } from 'jspdf';
import { renderLogoHeader } from '@/lib/pdf-logo-utils';

/**
 * Adiciona o cabeçalho padrão com o logo da Maria Faz a um documento PDF
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página
 * @param brandColor Cor principal da marca em formato RGB
 */
export function addMariaFazHeader(doc: jsPDF, pageWidth: number, brandColor: number[] = [41, 121, 255]): void {
  // Retângulo colorido superior - faixa de identidade visual
  doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Logo oficial da Maria Faz no cabeçalho (versão branca para fundo colorido)
  renderLogoHeader(doc, pageWidth, true);
}

/**
 * Configura o rodapé padrão com logo para um documento PDF
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página
 * @param pageHeight Altura da página
 * @param confidentialText Texto de confidencialidade
 * @param currentPage Número da página atual
 * @param totalPages Total de páginas
 * @param poweredByText Texto "Powered by" 
 */
export function addMariaFazFooter(
  doc: jsPDF, 
  pageWidth: number, 
  pageHeight: number,
  confidentialText: string = 'Documento Confidencial',
  currentPage: number = 1,
  totalPages: number = 1,
  poweredByText: string = 'Powered by Maria Faz'
): void {
  // Linha divisória fina
  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  
  // Numeração de página e marca de confidencialidade
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(117, 117, 117);
  doc.text(`${confidentialText} | ${poweredByText}`, 14, pageHeight - 8);
  doc.text(`${currentPage}/${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
}