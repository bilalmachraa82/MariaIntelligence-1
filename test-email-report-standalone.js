/**
 * Script standalone para testar o envio de relatórios por email
 * Implementa seu próprio serviço de email para testar o envio de relatório
 */

import fs from 'fs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente se existirem
dotenv.config();

async function testSendReport() {
  console.log('Iniciando teste de envio de relatório por email...');
  
  // Verificar credenciais
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword) {
    console.error('Credenciais de email não configuradas!');
    console.error('Verifique se EMAIL_USER e EMAIL_PASSWORD estão configurados.');
    return false;
  }
  
  console.log('✓ Credenciais de email encontradas');
  console.log(`Usando conta: ${emailUser}`);
  
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
  
  // Configurar transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  // Verificar conexão
  try {
    console.log('Verificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✓ Conexão com servidor SMTP estabelecida com sucesso!');
  } catch (error) {
    console.error('Erro na conexão SMTP:', error);
    return false;
  }
  
  // Dados para o relatório
  const ownerName = 'João Silva';
  const month = 'Março 2025';
  const emailDestination = emailUser; // Envia para o próprio email configurado
  
  console.log(`Enviando relatório para: ${emailDestination}`);
  console.log(`Nome do proprietário: ${ownerName}`);
  console.log(`Mês do relatório: ${month}`);
  
  // Preparar conteúdo do email
  const subject = `Relatório Mensal de Propriedade - ${month}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Maria Faz - Gestão de Propriedades</h2>
      <p>Olá ${ownerName},</p>
      <p>Em anexo está o seu relatório financeiro mensal para o período de <strong>${month}</strong>.</p>
      <p>Este relatório contém um resumo das suas propriedades, incluindo:</p>
      <ul>
        <li>Receitas de reservas</li>
        <li>Despesas operacionais</li>
        <li>Lucro líquido</li>
        <li>Taxa de ocupação</li>
      </ul>
      <p>Se tiver alguma dúvida, não hesite em responder a este email.</p>
      <p>Atenciosamente,<br/>Equipe Maria Faz</p>
      <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; font-size: 12px; color: #666;">
        <p>Este é um email automático. Por favor, não responda diretamente.</p>
      </div>
    </div>
  `;
  
  // Configuração do email
  const mailOptions = {
    from: emailUser,
    to: emailDestination,
    subject,
    html,
    attachments: [
      {
        filename: `Relatorio_${ownerName.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };
  
  // Enviar o email
  try {
    console.log('Enviando email com relatório...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
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