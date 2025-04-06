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

## Estrutura do Projeto

- `/client`: Código do frontend React
- `/server`: API backend em Express
- `/shared`: Schemas compartilhados entre frontend e backend
- `/uploads`: Diretório para uploads temporários de PDFs e documentos
- `/android`: Configuração do Capacitor para versão mobile Android

## Instalação e Configuração Local

### Requisitos

- Node.js 18+ (recomendado 20+)
- PostgreSQL 15+
- Chave API do Google Gemini
