# Maria Faz - Sistema Inteligente de Gestão de Propriedades

Sistema completo para gestão de propriedades, reservas e finanças para o negócio de gestão de alojamentos locais, com integração de inteligência artificial para processamento de documentos e assistência.

## Visão Geral

Maria Faz é uma plataforma avançada de gestão imobiliária com inteligência artificial integrada, projetada para gerenciar propriedades de alojamento local, reservas, e operações financeiras. A plataforma oferece uma interface responsiva multi-idioma com análise de dados inteligente e geração automatizada de relatórios.

### Para Quem é Este Sistema?

- **Gestores de Propriedades**: Empresas e profissionais que gerenciam múltiplas propriedades
- **Proprietários de Imóveis**: Pessoas com imóveis que buscam gerenciamento eficiente
- **Equipas de Limpeza**: Gestão de agendamentos e tarefas de limpeza
- **Contabilistas**: Acesso a relatórios financeiros detalhados

## Funcionalidades Principais

- **Gestão de Propriedades**: Cadastro e gestão completa de propriedades com detalhes, fotos e configurações
- **Gestão de Proprietários**: Cadastro e gestão de proprietários com relatórios personalizados e análise financeira
- **Gestão de Reservas**: Controle de reservas, check-ins e check-outs com confirmações automáticas
- **Orçamentos**: Sistema de criação e gestão de orçamentos para clientes com geração de PDF
- **Relatórios Financeiros**: Relatórios detalhados para proprietários, incluindo receitas, despesas e projeções
- **Estatísticas**: Análise de desempenho, ocupação e projeções financeiras com visualizações gráficas
- **Processamento de PDFs**: Extração automática de dados de reservas a partir de PDFs usando IA
- **Manutenção**: Gestão de tarefas de manutenção para propriedades com alertas e notificações
- **Assistente Maria (IA)**: Assistente com inteligência artificial para ajuda contextual e insights

## Tecnologias Utilizadas

### Frontend
- **Framework Principal**: React com TypeScript
- **Estilização**: TailwindCSS e Shadcn UI
- **Gerenciamento de Estado**: TanStack Query (React Query)
- **Roteamento**: Wouter
- **Formulários**: React Hook Form com validação Zod
- **Visualização de Dados**: Recharts e Tremor
- **Internacionalização**: i18next com suporte a Português (PT) e Inglês (EN)
- **Apps Móveis**: Capacitor para geração de apps nativos Android/iOS

### Backend
- **Runtime**: Node.js com Express
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: Passport.js com sessões
- **Upload de Arquivos**: Multer
- **Geração de PDF**: jsPDF
- **Envio de Emails**: Nodemailer

### Inteligência Artificial  
- **Processamento de Documentos**: Google Gemini Pro para OCR e extração de dados
- **Análise de Texto**: Processamento de linguagem natural para extrair informações de documentos
- **Assistente Virtual**: Interface conversacional para suporte ao usuário

### DevOps
- **Controle de Versão**: Git
- **Banco de Dados**: Neon PostgreSQL (serverless)
- **Deploy**: Docker com CI/CD via GitHub Actions
- **Segurança**: Helmet, Rate-limiting e Pino JSON para logs

## Estrutura do Projeto

- `/client`: Código do frontend React (componentes, páginas, hooks, utilitários)
- `/server`: API backend em Express (rotas, controladores, serviços)
- `/shared`: Schemas compartilhados entre frontend e backend (definições de tipos, validações)
- `/uploads`: Diretório para uploads temporários de PDFs e documentos
- `/docs`: Documentação técnica e guias de usuário
- `/android`: Configuração do Capacitor para versão mobile Android
- `/scripts`: Scripts de utilidade para manutenção e testes

## Fluxos de Trabalho Principais

### Processamento de Documentos
1. Upload de PDFs de reservas ou relatórios
2. Processamento automático via IA para extração de dados
3. Validação e confirmação dos dados extraídos
4. Integração com o sistema de reservas ou financeiro

### Gestão de Reservas
1. Criação manual ou importação automática via PDF
2. Agendamento de check-ins, check-outs e limpezas
3. Notificações para equipes e proprietários
4. Relatórios de ocupação e estatísticas

### Relatórios Financeiros
1. Registro de receitas e despesas por propriedade
2. Geração de relatórios personalizados para proprietários
3. Análise de rentabilidade e projeções financeiras
4. Exportação em PDF e envio automático por email

## Instalação e Configuração

### Requisitos
- Node.js 18+ (recomendado 20+)
- PostgreSQL 15+
- Chave API do Google Gemini (para funcionalidades de IA)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/maria-faz.git
   cd maria-faz
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` baseado no `.env.example`
   - Adicione suas credenciais do banco de dados
   - Configure a chave API do Google Gemini

4. Inicialize o banco de dados:
   ```bash
   npm run db:push
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Configuração da Base de Dados

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

## Gerenciamento de Dados de Demonstração

O sistema possui um mecanismo para gerenciar dados de demonstração, útil para testes e apresentações:

- **Geração de Dados**: Scripts para popular o sistema com dados de demonstração
- **Limpeza de Dados**: Funções para remover os dados de demonstração sem afetar dados reais
- **Modo Limpo**: Opção para desativar completamente os dados de demonstração

Para limpar todos os dados de demonstração, use o script:
```bash
node reset-all-demo-data.js
```

## Melhorias Recentes

### Migração do Serviço de IA

O sistema foi migrado do Mistral AI para o Google Gemini. Detalhes completos sobre esta migração estão disponíveis na [documentação de migração](./docs/AI-SERVICE-MIGRATION.md).

### Consolidação do OCR

O serviço de OCR foi consolidado em uma única rota `/api/ocr`, simplificando a API e melhorando a manutenção. Esta rota agora suporta a seleção de serviço via parâmetros de consulta.

### Correções no PgStorage

- Implementado o método `deleteActivity` que estava em falta
- Corrigido o tratamento de datas nos métodos `createMaintenanceTask` e `updateMaintenanceTask`
- Atualizado o método `getMaintenanceActivities` para usar SQL bruto e evitar problemas de tipagem

### Melhorias de Segurança

- Adicionado Helmet para proteção de headers HTTP
- Implementado rate-limiting para proteção contra ataques de força bruta
- Configurado Pino para logs em formato JSON com redacção de informações sensíveis

### DevOps

- Criado Dockerfile para containerização da aplicação
- Configurado GitHub Actions para CI/CD
- Adicionado docker-compose.yml para facilitar a execução em produção

### Testes

- Adicionados testes para o endpoint `/health`
- Adicionados testes para o método `deleteActivity` e `getMaintenanceActivities`
- Configurado Jest para garantir cobertura de testes superior a 80%

## Documentação Adicional

### Em Português
- [Índice da Documentação](./docs/README.md): Lista completa da documentação disponível
- [Migração de IA](./docs/AI-SERVICE-MIGRATION.md): Documentação detalhada sobre a migração do Mistral para o Google Gemini

### Em Inglês / In English
- [Documentation Index](./docs/README.md): Complete list of available documentation
- [English System Documentation](./docs/README-EN.md): Complete system documentation in English
- [AI Migration Documentation](./docs/AI-SERVICE-MIGRATION-EN.md): Detailed documentation on the migration from Mistral to Google Gemini

## Licença

© 2025 Maria Faz. Todos os direitos reservados.
