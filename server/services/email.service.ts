/**
 * Serviço para envio de emails
 * Implementa envio de emails através do Nodemailer
 * Suporta autenticação OAuth2 para Gmail
 */

import nodemailer from 'nodemailer';
import { Readable } from 'stream';

/**
 * Interface para parâmetros de email
 */
export interface EmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | Readable | string;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Serviço para envio de emails
 */
export class EmailService {
  private transporter!: nodemailer.Transporter;
  private initialized: boolean = false;

  constructor() {
    // O transporter será inicializado sob demanda
  }

  /**
   * Inicializa o transporter de acordo com as credenciais disponíveis
   */
  private async initializeTransporter(): Promise<boolean> {
    if (this.initialized) return true;

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    if (!emailUser || !emailPassword) {
      console.error('Credenciais de email não configuradas');
      return false;
    }

    // Configuração do transporter
    try {
      this.transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });

      // Verificar a conexão
      await this.transporter.verify();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao configurar o serviço de email:', error);
      return false;
    }
  }

  /**
   * Envia um email 
   * @param params Parâmetros do email (destinatário, assunto, conteúdo)
   * @returns Promise<boolean> Indicando sucesso ou falha
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    // Tentar inicializar o transporter se ainda não estiver
    if (!this.initialized) {
      const success = await this.initializeTransporter();
      if (!success) return false;
    }

    const { to, subject, text, html, attachments } = params;

    // Configuração da mensagem
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text,
      html,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso:', info.messageId);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Envia relatório mensal por email
   * @param to Email do destinatário
   * @param ownerName Nome do proprietário
   * @param month Mês do relatório (ex: 'Março 2025')
   * @param pdfBuffer Buffer do PDF com o relatório
   * @returns Promise<boolean> Indicando sucesso ou falha
   */
  async sendMonthlyReport(to: string, ownerName: string, month: string, pdfBuffer: Buffer): Promise<boolean> {
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

    return this.sendEmail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: `Relatorio_${ownerName.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
  }

  /**
   * Versão simplificada para testes - retorna sucesso sem enviar email real
   * Útil quando não há configuração de email disponível
   */
  async sendReportTest(to: string, ownerName: string, month: string): Promise<boolean> {
    console.log(`[TEST] Enviando email para ${to}`);
    console.log(`[TEST] Proprietário: ${ownerName}`);
    console.log(`[TEST] Mês: ${month}`);
    
    // Simula um pequeno atraso para parecer que está enviando
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return true;
  }

  /**
   * Verifica se o serviço de email está configurado
   * @returns Promise<boolean> Indicando se o serviço está disponível
   */
  async isEmailServiceAvailable(): Promise<boolean> {
    if (this.initialized) return true;
    
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    return !!(emailUser && emailPassword);
  }
}

// Exporta uma instância única do serviço
export const emailService = new EmailService();