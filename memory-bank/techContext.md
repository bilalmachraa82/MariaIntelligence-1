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

- Processamento de arquivos deve ser rápido (<5s)
- Interface deve ser mobile-first
- Estrutura preparada para multi-tenant em versões futuras

## Observações

- Este arquivo deve ser atualizado sempre que houver mudanças relevantes no stack ou setup do projeto.
