import { downloadOwnerReportPDF } from './pdf-export-utils';
import { OwnerReport } from '@/hooks/use-owner-report';

/**
 * Exporta relatório com logo oficial para PDF
 * Esta função é apenas um wrapper que garante o uso das funções mais recentes de rendering
 */
export function exportOwnerReportPDFWithLogo(
  report: OwnerReport,
  reportType: 'summary' | 'properties' | 'reservations' | 'full' = 'full',
  language = 'pt-PT'
): void {
  // Chama a função existente para download do PDF
  downloadOwnerReportPDF(report, reportType, language);
}