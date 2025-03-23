import { jsPDF } from 'jspdf';

// Dados do logo oficial Maria Faz em formato PNG (base64)
// Utilizamos um logo PNG simples para garantir compatibilidade em todos os PDFs
export const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE+ElEQVR4nO2cW4hVVRjHf+fMmItjpZbYbTJ6sSwJoijtQka9ZIWUPaQVBZbdi0KvvfRWQUL0UD31oGBBQUUZUhYVhVFeSsRLZJTlRLO5TNfpdGbWsGbmnH322Wfvs9ba35rz/2Fgzuy91/ft3/nWd/nWt74lhBBCCCGEEEIIIYQQQgghhBBCCCGE8IoUg1MJrATmAHXgKDAErAU+KYB2AELRDCFXY33AtcDnwJiVgHIy0B9Nz3pghtrWBHYBQ8AmYLfPxnUqVPaA2h4HngJm++7ISqB2PZAWvyIwgRbA3qeaL6Y+nYEWdLRrTpnCbRFGYPMT/R1YqP7fC6wGrjL5ZQdKoL3Oa3NmPaS2XwGmZf1lW4HJ0DwwkqF5ALuBL9X/M4GlJkD+EmhugXYClwAvACcdfEYdOKi2b07bMbcCXeRBYA/wPXCnGmo+mDT9oI0fI5grkw1Z9szJtY5hqZpq3AXMAR4Hfkv4vAZwEfBYhn5FvghJFWGEehG4A+jP0JfTwB516JpUF0qTwH7gUeB2YAGwAfhtgndOA7uAn4E1wEvAQMa+xArGhG2JSc7C7dTgd62ZHQGWAPeqdl7l2LcwDsaEdWmgA54ALFQWbQAuA94A/nHcrihDLhNFHPVjgJeBwYTvJ3cFziDZ3SFOAluAG4AlwMsY+7tUFDU6VWO0U56VWjcDLwB/WP0bAr4F1mGWWitihqB5v7cOeAQYDRCo+jplzZTI24EngZdirDoJrMRc4UlbJ46k+dw5GKt8LUA/SjNosjhhB1aqnf89o/EhYBXwMnAmp0BFXg5cDpwr+FU/UOqBLiYwDXnISmAF8Loqb6ahrpa1lwJ3qf2HgO+ANxPq54oI2mTF9HrS1J+RwBVqyjCGGfrfZpCaWoxMAp6O/VYf2YF+Gjh9iJX++2W0V9OeQBeLkXsI/xDH+f9+j9PJUzhC1mEo4oScUuSRs4tCOYW5CxhIWyFtAjP0HfU1SnrwK+GCyDU105YBM8i+HOllpCrD5hQOE13oTYNXz9LQTsBwgH5EIx9pJcn8FG5ifr42aXFAR6GWkYtJZJoRGO+U9p5FjxtS9KkdaUK20yncsaRJwClFTSekMskI1PLbRGjdkNBB+iFrL5y2jHESeMJTZzphVUNnRH5lRQRapzBrAdJsRHSCkxWpkvBJBPpysefRuOiUT8wFVTKDTbqvDDssTgQu1GWcwhQpfnKDWsNlSRJ0pJgaIOlrJwRQ5cBXdCbiQpXO+T5oCE+B9X/SHRGxWFW7S1XlqKQlpWyFjwBKUYgXc5qGbxFp5TZJI+hIjsNFH8OO6A5WCnSDuILO9yLZBFwEDoboUCnwsRSpJ9XOUWlbFyJvfhVfNmjTt0+AE2HpVJqGP13jDvdS4oJT58OYIPKKwFGM68P5c/tQAmuYUBtrzEhcGUY7MnxxC7IYuHkSBj3GGeA9jPNgJQkdr1C+IIoTJTENyMwY/Y55jlwLHKCYfoau0ZjKSKHCcfIisAlzP3SBKlfXMOvK9zFzRa99mEKyRWWUQlP4zPsC4CbMQ5d5mIcyUfzlV+B7jAP+Rip+K1EIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQohC8C/I6+yQmEZK2QAAAABJRU5ErkJggg==';

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
    'PNG',
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
    'PNG',
    logoPosX,
    logoPosY,
    logoWidth,
    logoHeight
  );
}