/**
 * Script para testar o envio de relatórios por email
 * Usa o serviço de email para enviar um PDF de relatório
 */

import fs from 'fs';
import { emailService } from './server/services/email.service.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente se existirem
dotenv.config();

async function testSendReport() {
  console.log('Iniciando teste de envio de relatório por email...');
  
  // Verificar serviço de email
  const isAvailable = await emailService.isEmailServiceAvailable();
  if (!isAvailable) {
    console.error('Serviço de email não está disponível!');
    console.error('Verifique se EMAIL_USER e EMAIL_PASSWORD estão configurados.');
    return false;
  }
  
  console.log('✓ Serviço de email está disponível');
  
  // Verificar arquivo PDF
  const pdfPath = './teste-relatorio.pdf';
  if (!fs.existsSync(pdfPath)) {
    console.error('Arquivo PDF não encontrado:', pdfPath);
    console.error('Execute primeiro o script test-generate-pdf-report.js');
    return false;
  }
  
  console.log('✓ Arquivo PDF encontrado');
  
  // Ler o arquivo PDF
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log('Tamanho do PDF:', pdfBuffer.length, 'bytes');
  
  // Dados para o relatório
  const ownerName = 'João Silva';
  const month = 'Março 2025';
  const emailDestination = process.env.EMAIL_USER; // Envia para o próprio email configurado
  
  console.log(`Enviando relatório para: ${emailDestination}`);
  console.log(`Nome do proprietário: ${ownerName}`);
  console.log(`Mês do relatório: ${month}`);
  
  // Enviar o relatório
  try {
    const result = await emailService.sendMonthlyReport(
      emailDestination,
      ownerName,
      month,
      pdfBuffer
    );
    
    if (result) {
      console.log('✓ Relatório enviado com sucesso!');
      return true;
    } else {
      console.error('Falha ao enviar o relatório.');
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar relatório:', error);
    return false;
  }
}

// Executar o teste
testSendReport()
  .then(success => {
    if (success) {
      console.log('Teste de envio de relatório concluído com sucesso!');
      process.exit(0);
    } else {
      console.error('Teste falhou. Verifique os logs acima.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
  });