# techContext.md

## Tecnologias Utilizadas

- **Backend:** Node.js 18, Fastify, BullMQ, ioredis, Winston (logs)
- **Frontend:** React, Vite, TailwindCSS, TanStack React Query, Radix UI, Tremor, Shadcn
- **OCR/AI:** Mistral-OCR via OpenRouter, RolmOCR (manuscritos)
- **Banco de Dados:** PostgreSQL
- **DevOps/Deploy:** Railway (API/backend), Netlify (frontend)
- **Testes:** Jest, Supertest, ts-jest, Playwright

## Setup de Desenvolvimento

- Gerenciador de pacotes: pnpm
- Scripts principais definidos no package.json da raiz
- Estrutura monorepo, mas sem package.json dedicado em client/
- Variáveis de ambiente em .env (chaves de API, tokens, etc)
- Utilização de scripts auxiliares para migração de banco, reset de dados e testes

## Dependências e Integrações

- Integração com serviços externos de OCR via API (OpenRouter, HuggingFace)
- Uso de filas para processamento assíncrono de OCR
- Integração com Railway e Netlify para deploy contínuo

## Restrições Técnicas

- Processamento de arquivos deve ser rápido (<5s) - **Alcançado com processamento assíncrono**
- Interface deve ser mobile-first - **Implementado com TailwindCSS responsivo**
- Estrutura preparada para multi-tenant em versões futuras - **Base implementada com design de banco isolado**
- Sistema de testes unitários e e2e - **Parcialmente implementado**

## Serviços Cloud & Deploy

- **Frontend:** Netlify (https://maria-faz-1.netlify.app)
- **Backend:** Railway (API REST)
- **Database:** PostgreSQL via Railway
- **Filas:** Redis/BullMQ via Railway

## Ambientes

- **Produção:** Frontend em Netlify, Backend em Railway
- **Dev:** Local com pnpm dev
- **CI/CD:** GitHub Actions para testes (parcialmente implementado)

## Problemas Técnicos Pendentes

- Erros de tipo no módulo storage.ts impedindo a execução de testes
- Necessidade de melhorar as tipagens do TypeScript em certas partes do código
- Documentation API para endpoints (Swagger/OpenAPI)

## Observações

- Sistema está operacional e deployado em ambiente de produção
- Todas as funcionalidades principais estão implementadas e funcionando
- Possibilidade de atualização contínua via CI/CD quando os testes forem corrigidos
