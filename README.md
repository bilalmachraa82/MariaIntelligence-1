# Maria Faz - Sistema Inteligente de Gestão de Propriedades

Sistema completo para gestão de propriedades, reservas e finanças para o negócio de gestão de alojamentos locais, com integração de inteligência artificial para processamento de documentos e assistência.

## Funcionalidades Principais

- **Gestão de Propriedades**: Cadastro e gestão completa de propriedades
- **Gestão de Proprietários**: Cadastro e gestão de proprietários com relatórios personalizados
- **Gestão de Reservas**: Controle de reservas, check-ins e check-outs
- **Orçamentos**: Sistema de criação e gestão de orçamentos para clientes com geração de PDF
- **Relatórios Financeiros**: Relatórios detalhados para proprietários, incluindo receitas e despesas
- **Estatísticas**: Análise de desempenho, ocupação e projeções financeiras
- **Processamento de PDFs**: Extração automática de dados de reservas a partir de PDFs
- **Manutenção**: Gestão de tarefas de manutenção para propriedades
- **Assistente Maria (IA)**: Assistente com inteligência artificial para ajuda contextual

## Tecnologias

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL + Drizzle ORM
- **Inteligência Artificial**: 
  - Google Gemini Pro para processamento de documentos e assistência
- **Internacionalização**: i18next com suporte a Português (PT) e Inglês (EN)
- **Mobile**: Capacitor para apps nativos Android/iOS

## Estrutura do Projeto

- `/client`: Código do frontend React
  - `/src/components`: Componentes UI reutilizáveis
  - `/src/pages`: Páginas da aplicação
  - `/src/hooks`: Hooks customizados e lógica de negócio
  - `/src/i18n`: Configuração de internacionalização e traduções
- `/server`: API backend em Express
  - `/routes`: Rotas da API
  - `/services`: Serviços de negócio e integrações
  - `/db`: Configuração do banco de dados
- `/shared`: Schemas compartilhados entre frontend e backend
- `/uploads`: Diretório para uploads temporários de PDFs e documentos
- `/android`: Configuração do Capacitor para versão mobile Android

## Informações da Base de Dados

### Detalhes de Conexão

- **Nome do Host**: ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech
- **Nome da Base de Dados**: neondb
- **Usuário**: neondb_owner
- **Senha**: npg_5HAIWZB9tncz
- **URL de Conexão Completa**: 
  ```
  postgresql://neondb_owner:npg_5HAIWZB9tncz@ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```

### Acesso à Base de Dados

A base de dados é hospedada no serviço Neon PostgreSQL, que oferece um PostgreSQL serverless na nuvem. Para conectar:

1. Use a URL de conexão diretamente nos seus aplicativos
2. Ou conecte-se usando um cliente SQL como:
   - psql: `psql "postgresql://neondb_owner:npg_5HAIWZB9tncz@ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech/neondb?sslmode=require"`
   - Ferramentas gráficas como DBeaver, pgAdmin ou TablePlus usando os detalhes acima

**Nota**: Esta conexão requer SSL (sslmode=require).

## Instalação e Configuração Local

### Requisitos

- Node.js 18+ (recomendado 20+)
- PostgreSQL 15+
- Chave API do Google Gemini

### Passos para Instalação

1. Clone o repositório:
   ```bash
   git clone [URL_DO_REPOSITÓRIO]
   cd maria-faz
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_5HAIWZB9tncz@ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech/neondb?sslmode=require
   GOOGLE_GEMINI_API_KEY=sua_chave_api_gemini
   EMAIL_SERVICE=gmail
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASSWORD=sua_senha_ou_app_password
   ```

4. Prepare o banco de dados:
   ```bash
   npm run db:push
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Gera o build de produção
- `npm run start`: Executa a aplicação em ambiente de produção
- `npm run db:push`: Atualiza o banco de dados com o schema atual
- `npm run db:studio`: Abre o Drizzle Studio para visualização/edição do banco de dados

## Deployment

O projeto está configurado para deploy via Replit CloudRun. Para implantar:

1. Execute `npm run build` para gerar os arquivos de produção
2. Configure as variáveis de ambiente necessárias
3. Use o botão de Deploy no Replit para iniciar o deployment

## Variáveis de Ambiente Necessárias

- `DATABASE_URL`: URL de conexão ao banco de dados PostgreSQL
- `GOOGLE_GEMINI_API_KEY`: Chave de API para o Google Gemini AI
- `EMAIL_SERVICE`: Serviço de email (ex: "gmail")
- `EMAIL_USER`: Endereço de email para envio de relatórios
- `EMAIL_PASSWORD`: Senha ou token para autenticação do email

## Recursos Externos

- **Serviço de IA**: Google Gemini AI para processamento de documentos e assistente virtual
- **Serviço de Email**: Para envio de relatórios aos proprietários e orçamentos aos clientes

## Capacitor Mobile

O projeto inclui configuração para criar apps móveis usando Capacitor. Para construir a versão Android:

1. Execute `npm run build`
2. Execute `npx cap sync`
3. Execute `npx cap open android`

## Funcionalidades Específicas

- **Processamento de PDFs**: O sistema consegue extrair dados de PDFs específicos como check-ins e check-outs
- **Orçamentos Personalizados**: Geração de orçamentos baseados no tipo e tamanho da propriedade
- **Relatórios Financeiros**: Exportação de relatórios detalhados em PDF para proprietários
- **Assistente IA**: Capacidade de responder perguntas sobre o negócio e as propriedades usando dados do sistema
