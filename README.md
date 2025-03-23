# Maria Faz - Sistema de Gestão de Propriedades

Sistema completo para gestão de propriedades, reservas e finanças para o negócio de gestão de alojamentos locais.

## Funcionalidades Principais

- **Gestão de Propriedades**: Cadastro e gestão de propriedades
- **Gestão de Proprietários**: Cadastro e gestão de proprietários
- **Gestão de Reservas**: Controle de reservas, check-ins e check-outs
- **Relatórios Financeiros**: Relatórios detalhados para proprietários
- **Estatísticas**: Análise de desempenho e ocupação
- **Processamento de PDFs**: Extração automática de dados de reservas a partir de PDFs
- **Assistente Maria**: Assistente com inteligência artificial para ajuda contextual

## Tecnologias

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL
- **Inteligência Artificial**: Mistral AI para processamento de documentos
- **Internacionalização**: i18next com suporte a Português (PT)

## Estrutura do Projeto

- `/client`: Código do frontend React
- `/server`: API backend em Express
- `/shared`: Schemas compartilhados entre frontend e backend
- `/uploads`: Diretório para uploads temporários
- `/android`: Configuração do Capacitor para versão mobile Android

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Gera o build de produção
- `npm run start`: Executa a aplicação em ambiente de produção
- `npm run db:push`: Atualiza o banco de dados com o schema atual

## Deployment

O projeto está configurado para deploy via Replit CloudRun. Para implantar:

1. Execute `npm run build` para gerar os arquivos de produção
2. Configure as variáveis de ambiente necessárias
3. Use o botão de Deploy no Replit para iniciar o deployment

## Variáveis de Ambiente Necessárias

- `DATABASE_URL`: URL de conexão ao banco de dados PostgreSQL
- `MISTRAL_API_KEY`: Chave de API para o Mistral AI
- `EMAIL_SERVICE`: Serviço de email (ex: "gmail")
- `EMAIL_USER`: Endereço de email para envio de relatórios
- `EMAIL_PASSWORD`: Senha ou token para autenticação do email

## Recursos Externos

- Mistral AI: Para processamento de documentos e assistente virtual
- Serviço de Email: Para envio de relatórios aos proprietários

## Capacitor Mobile

O projeto inclui configuração para criar apps móveis usando Capacitor. Para construir a versão Android:

1. Execute `npm run build`
2. Execute `npx cap sync`
3. Execute `npx cap open android`