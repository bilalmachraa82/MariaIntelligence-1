/**
 * Script para gerar um PDF de relatório de teste
 * Cria um PDF simples para testar o envio de emails com anexos
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';

async function generateTestReport() {
  console.log('Gerando PDF de relatório de teste...');
  
  // Criar documento PDF
  const doc = new jsPDF();
  
  // Adicionar título e informações
  doc.setFontSize(18);
  doc.text('Maria Faz - Relatório Mensal', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Proprietário: João Silva', 20, 35);
  doc.text('Mês: Março 2025', 20, 42);
  doc.text('Data de geração: ' + new Date().toLocaleDateString('pt-BR'), 20, 49);
  
  // Adicionar resumo financeiro
  doc.setFontSize(14);
  doc.text('Resumo Financeiro', 20, 65);
  
  const summaryData = [
    ['Receita Total', '€ 3.540,00'],
    ['Despesas', '€ 890,00'],
    ['Lucro Líquido', '€ 2.650,00'],
    ['Taxa de Ocupação', '76%']
  ];
  
  autoTable(doc, {
    startY: 70,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }
  });
  
  // Adicionar detalhes de propriedades
  doc.setFontSize(14);
  doc.text('Detalhes por Propriedade', 20, 120);
  
  const propertiesData = [
    ['Apartamento Lisboa Centro', '€ 1.850,00', '€ 450,00', '€ 1.400,00', '82%'],
    ['Casa Cascais', '€ 1.690,00', '€ 440,00', '€ 1.250,00', '70%']
  ];
  
  autoTable(doc, {
    startY: 125,
    head: [['Propriedade', 'Receita', 'Despesas', 'Lucro', 'Ocupação']],
    body: propertiesData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }
  });
  
  // Adicionar detalhes de reservas
  doc.setFontSize(14);
  doc.text('Reservas do Período', 20, 175);
  
  const reservationsData = [
    ['Apartamento Lisboa Centro', '01/03/2025', '10/03/2025', 'João Pereira', '€ 850,00'],
    ['Apartamento Lisboa Centro', '15/03/2025', '25/03/2025', 'Maria Santos', '€ 1.000,00'],
    ['Casa Cascais', '05/03/2025', '15/03/2025', 'António Costa', '€ 1.100,00'],
    ['Casa Cascais', '20/03/2025', '25/03/2025', 'Carla Dias', '€ 590,00']
  ];
  
  autoTable(doc, {
    startY: 180,
    head: [['Propriedade', 'Check-in', 'Check-out', 'Hóspede', 'Valor']],
    body: reservationsData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }
  });
  
  // Adicionar rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      'Gerado pelo sistema Maria Faz - Página ' + i + ' de ' + pageCount,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Salvar o PDF
  const pdfBytes = doc.output();
  const filePath = './teste-relatorio.pdf';
  
  fs.writeFileSync(filePath, pdfBytes, 'binary');
  console.log(`PDF gerado com sucesso: ${filePath}`);
  
  return {
    path: filePath,
    buffer: Buffer.from(pdfBytes, 'binary')
  };
}

// Executar a geração
generateTestReport()
  .then(result => {
    console.log('Tamanho do PDF:', result.buffer.length, 'bytes');
  })
  .catch(err => {
    console.error('Erro ao gerar PDF:', err);
  });