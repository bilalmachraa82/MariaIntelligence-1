import { jsPDF } from 'jspdf';

// Dados do logo oficial Maria Faz em formato SVG (base64)
// Utilizamos um logo SVG simples para garantir compatibilidade em todos os PDFs
export const LOGO_BASE64 = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEPDrXJjdWxvIGV4dGVyaW9yIC0tPgogIDxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjM4IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMjk3OUZGIiBzdHJva2Utd2lkdGg9IjMiLz4KICAKICA8IS0tIFRleHRvICJNRiIgLS0+CiAgPHBhdGggZD0iTTI0LjUgNThWMjJIMzAuNUwzOSA0NC41TDQ3LjUgMjJINTMuNVY1OEg0Ny41VjMyTDQwIDUxLjVIMzhMMzAuNSAzMlY1OEgyNC41WiIgZmlsbD0iIzI5NzlGRiIvPgo8L3N2Zz4=';

/**
 * Renderiza o logo oficial no cabeçalho do PDF
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página em mm
 */
export function renderLogoHeader(
  doc: jsPDF,
  pageWidth: number
): void {
  // Configurações para posicionamento do logo
  const logoWidth = 30; // largura do logo em mm
  const logoHeight = 15; // altura proporcional do logo
  const logoPosX = pageWidth - logoWidth - 14; // posição X (margem direita)
  const logoPosY = 14; // posição Y (topo da página)
  
  // Adicionar o logo Maria Faz ao cabeçalho
  doc.addImage(
    LOGO_BASE64,
    'SVG',
    logoPosX,
    logoPosY,
    logoWidth,
    logoHeight
  );
}

/**
 * Renderiza o logo oficial no rodapé do PDF (versão menor)
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página em mm
 * @param pageHeight Altura da página em mm
 */
export function renderLogoFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number
): void {
  // Configurações para posicionamento do logo no rodapé
  const logoWidth = 20; // largura do logo em mm (menor no rodapé)
  const logoHeight = 10; // altura proporcional do logo
  const logoPosX = pageWidth - logoWidth - 14; // posição X (margem direita)
  const logoPosY = pageHeight - logoHeight - 10; // posição Y (rodapé da página)
  
  // Adicionar o logo Maria Faz ao rodapé
  doc.addImage(
    LOGO_BASE64,
    'SVG',
    logoPosX,
    logoPosY,
    logoWidth,
    logoHeight
  );
}