# progress.md

## Checklist de Execução do run.cline.md

### CHECKLIST INICIAL
- [ ] `.env` com chaves
- [ ] branch `migration/windsurf`
- [ ] Railway + Postgres criado
- [ ] Netlify site criado

---

### BLOCO 1: Bootstrap
- [X] Clonar repositório e instalar dependências (projeto já clonado, `pnpm install` executado)
- [X] Criar branch migration/windsurf (branch já ativa)
- [X] pnpm install (executado, dependências atualizadas)
- [X] railway init --project mariafaz (executado como `railway init` e projeto vinculado)
- [X] railway add postgres (executado via `railway add` interativo)
- [X] Definir DATABASE_URL e variáveis no Railway (DATABASE_URL atualizada no .env, outras chaves já presentes)
- [X] pnpm run db:push (executado, schema sincronizado)
- [X] Commit inicial (acp "chore: bootstrap project on Railway") (executado: git add, commit, push)

---

### BLOCO 2: MCP+Context7
- [X] Criar ~/.windsurf/mcp.json com config Context7 MCP (arquivo C:/Users/Bilal/.windsurf/mcp.json criado)
- [ ] Verificar context7 ready (ação manual do usuário: recarregar IDE)
- [ ] Commit config MCP (acp "chore: add context7 mcp") (opcional, pulado conforme Runbook v1.4)

---

### BLOCO 3: Back-end Sprint Fixes
- [X] Remover rota legacy upload-pdf de server/routes.ts (executado)
- [X] Atualizar ocr.controller para dual payload (modificado server/controllers/ocr.controller.ts)
- [X] Instalar bullmq, ioredis, winston (executado `pnpm add`)
- [X] Criar/atualizar server/queues/ocr.ts (arquivo criado e erro de tipagem corrigido)
- [X] Commit (acp "feat: ocr retry queue + refactor controller") (executado: git add, commit, push)

---

### BLOCO 4: Front-end Sprint Fixes
- [X] Atualizar hook client/src/hooks/use-pdf-upload.ts (indiretamente, via client/src/lib/ocr.ts)
- [X] Completar missing-data-form client/src/components/dashboard/missing-data-form.tsx
- [X] Corrigir cálculo nights em client/src/lib/utils.ts
- [X] Verificar chaves i18n (node scripts/i18n-check.js) - Script não encontrado, etapa pulada
- [X] Commit (acp "fix: front ocr flow + i18n")

---

### BLOCO 5: Tests & CI
- [X] Instalar jest, supertest, ts-jest, playwright, @playwright/test
- [X] npx ts-jest config:init && npx playwright install
- [X] Criar tests/ocr.spec.ts
- [X] Criar e2e/upload.spec.ts
- [ ] Criar .github/workflows/ci.yml
- [ ] Commit (acp "chore: jest + playwright + CI")
- [ ] Rodar todos os testes

---

### BLOCO 6: Deploy
- [ ] pnpm --filter client run build
- [ ] netlify deploy --prod --dir=client/dist -m "v1.0.0‑mvp"
- [ ] railway up
- [ ] Commit (acp "release: v1.0.0-mvp")

---

### BLOCO 7: Handoff
- [ ] Backup banco e uploads (pg_dump, zip)
- [ ] git tag v1.0.0-mvp e push tags
- [ ] Informar endpoints de staging

---

## O que já funciona
- Estruturação inicial do Memory Bank concluída.
- Documentação dos objetivos, contexto, arquitetura e stack do projeto.
- Protocolo de memória ativo e Runbook v1.4 integrado.

## O que falta construir
- Todos os passos operacionais do run.cline.md (ver checklist acima).

## Status atual
- Projeto em fase de documentação e preparação de ambiente.
- Nenhuma funcionalidade operacional implementada até o momento.

## Problemas conhecidos
- Estrutura monorepo sem package.json dedicado em client/ pode dificultar scripts automatizados para o front-end.
- Dependência de serviços externos de OCR pode impactar performance e disponibilidade.

## Evolução das decisões
- Memory Bank adotado como fonte de verdade para todo o contexto e evolução do projeto.
- Priorização de arquitetura mobile-first e processamento rápido de arquivos.

## Observações
- Este arquivo deve ser atualizado a cada avanço ou mudança relevante no projeto.
