/**
 * Script para testar o serviço de email
 * Envia um email de teste para confirmar que as credenciais estão corretas
 */

const nodemailer = require('nodemailer');

async function testEmailService() {
  console.log('Iniciando teste do serviço de email...');
  
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword) {
    console.error('Credenciais de email não configuradas!');
    console.error('Por favor, defina EMAIL_USER e EMAIL_PASSWORD como variáveis de ambiente.');
    return false;
  }
  
  console.log(`Usando conta: ${emailUser}`);
  
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
  
  try {
    // Verificar conexão
    console.log('Verificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✓ Conexão com servidor SMTP estabelecida com sucesso!');
    
    // Enviar email de teste
    console.log('Enviando email de teste...');
    const info = await transporter.sendMail({
      from: emailUser,
      to: emailUser, // Envia para si mesmo como teste
      subject: 'Maria Faz - Teste de Email',
      text: 'Este é um email de teste do sistema Maria Faz. Se você está vendo esta mensagem, a configuração de email está funcionando corretamente!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Maria Faz - Teste de Email</h2>
          <p>Este é um email de teste do sistema Maria Faz.</p>
          <p>Se você está vendo esta mensagem, a configuração de email está <strong>funcionando corretamente</strong>!</p>
          <p>Informações adicionais:</p>
          <ul>
            <li>Data e hora do teste: ${new Date().toLocaleString('pt-BR')}</li>
            <li>Ambiente: Teste de desenvolvimento</li>
          </ul>
          <p>Agora você pode enviar relatórios mensais para proprietários através do sistema Maria Faz.</p>
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; font-size: 12px; color: #666;">
            <p>Este é um email automático para teste. Por favor, não responda diretamente.</p>
          </div>
        </div>
      `
    });
    
    console.log('✓ Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    console.log('Teste concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao testar serviço de email:', error);
    return false;
  }
}

// Executar o teste
testEmailService()
  .then(success => {
    if (success) {
      console.log('Configuração de email está pronta para uso!');
      process.exit(0);
    } else {
      console.error('Teste falhou. Verifique as credenciais e tente novamente.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
  });