.# ——— MEMORY BANK ———
```json title=.cline_memory_bank/maria-faz.json
{
  "name": "Maria Faz – MVP",
  "summary": "App de gestão AL com OCR (Mistral‑OCR via OpenRouter; RolmOCR manuscrito), BD PostgreSQL",
  "goals": [
    "Processar reservas PDF/IMG <5 s",
    "UI mobile‑first",
    "Deploy Railway API + Netlify front",
    "Preparar multi‑tenant v2"
  ],
  "tech": {"backend":"Node 18 Fastify","frontend":"React Vite","ai":"Mistral‑OCR","dev":"Windsurf+Cline"}
}
```

# ——— ALIASES ———
```
 c  continue | i investigate | f fix | t add tests | a all tests | acp add‑commit‑push
```

# ——— CHECKLIST INICIAL ———
- [ ] `.env` com chaves
- [ ] branch `migration/windsurf`
- [ ] Railway + Postgres criado
- [ ] Netlify site criado

# ——— BLOCO 1 Bootstrap ———
```bash
### clone & deps
git clone https://github.com/bilalmachraa82/MariaIntelligence-1.git
cd MariaIntelligence-1 && git checkout -b migration/windsurf
pnpm install

### railway provision
railway init --project mariafaz && railway add postgres
export DATABASE_URL=$(railway status | awk '/postgres/ {print $NF}')
railway variables set DATABASE_URL=$DATABASE_URL OPENROUTER_API_KEY=$OPENROUTER_API_KEY HF_TOKEN=$HF_TOKEN PRIMARY_AI=openrouter

pnpm run db:push
acp "chore: bootstrap project on Railway"
```
`c`

# ——— BLOCO 2 MCP+Context7 ———
```bash
mkdir -p ~/.windsurf && cat > ~/.windsurf/mcp.json <<'EOF'
{"mcpServers":{"context7":{"command":"npx","args":["-y","@upstash/context7-mcp@latest"]}}}
EOF
```
Reload IDE ⇒ verifica *context7 ready*.  
`acp "chore: add context7 mcp"` 
`c`

# ——— BLOCO 3 Back‑end Sprint Fixes ———
```bash
# remove legacy upload‑pdf route
sed -i '' '/upload-pdf/d' server/routes.ts

# update ocr.controller for dual payload
code server/controllers/ocr.controller.ts
f

# add bullmq retry queue
pnpm add bullmq ioredis winston
code server/queues/ocr.ts
f
acp "feat: ocr retry queue + winston logs"
```
`c`

# ——— BLOCO 4 Front‑end Sprint Fixes ———
```bash
# hook endpoint update
code client/src/hooks/use-pdf-upload.ts
f

# missing‑data UI
code client/src/components/dashboard/missing-data-form.tsx
f

# nights calc util
code client/src/lib/utils.ts
f

# i18n missing keys\ nnode scripts/i18n-check.js
acp "fix: front ocr flow + i18n"
```
`c`

# ——— BLOCO 5 Tests & CI ———
```bash
pnpm add -D jest supertest ts-jest playwright @playwright/test
npx ts-jest config:init && npx playwright install
code tests/ocr.spec.ts
 t
code e2e/upload.spec.ts
 t

# github action\ ncode .github/workflows/ci.yml
f
acp "chore: jest + playwright + CI"
```
`a`  # run all tests 
`c`

# ——— BLOCO 6 Deploy ———
```bash
pnpm --filter client run build
netlify deploy --prod --dir=client/dist -m "v1.0.0‑mvp"
railway up
acp "release: v1.0.0-mvp"
```

# ——— BLOCO 7 Handoff ———
```bash
pg_dump $DATABASE_URL > backup.sql && zip uploads.zip uploads/
git tag v1.0.0-mvp -a -m "MVP pronto" && git push origin --tags
printf "Staging: https://mariafaz.netlify.app (API em %s)\n" "$(railway status | awk '/endpoints/ {print $NF}')" | pbcopy
```

# ——— FIM ———