# 🚨 Plano de Correção Completo - MariaFaz

## 📊 Estado Atual

### ✅ O que está funcionando:
- Site está em português (confirmado)
- Deploy no Vercel está ativo
- APIs configuradas localmente (Mistral, OpenRouter, Gemini)
- Código fonte atualizado no GitHub

### ❌ Problemas Identificados:
1. **DATABASE_URL não configurada no Vercel**
2. **AnimatePresence not defined** (erro de build)
3. **Integração com APIs em produção**
4. **Variáveis de ambiente faltantes no Vercel**

## 🔧 Plano de Correção Detalhado

### 1️⃣ Configurar DATABASE_URL no Vercel (URGENTE)

**Problema**: A conexão com Neon está falhando porque a DATABASE_URL não está configurada no Vercel.

**Solução**:
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto "mariafaz"
3. Vá em: Settings > Environment Variables
4. Adicione:
   ```
   DATABASE_URL = postgresql://[seu-usuario]:[sua-senha]@[seu-host].neon.tech/[database]?sslmode=require
   ```

**Alternativa**: Se não tiver as credenciais do Neon:
1. Crie nova conta em: https://neon.tech
2. Crie novo projeto "mariafaz"
3. Copie a connection string
4. Configure no Vercel

### 2️⃣ Corrigir AnimatePresence Error

**Problema**: Componente AnimatePresence do Framer Motion não está sendo importado corretamente.

**Arquivos afetados**:
- Componentes que usam animações
- motion-fallback.tsx

**Correção necessária**:
```typescript
// Adicionar import em componentes que usam AnimatePresence
import { AnimatePresence } from 'framer-motion';
```

### 3️⃣ Configurar Todas as Variáveis no Vercel

**Variáveis Necessárias**:
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=[gerar uma string aleatória segura]
MISTRAL_API_KEY=jtNu4jxEBW... (já temos)
OPENROUTER_API_KEY=sk-or-v1-2... (já temos)
GOOGLE_GEMINI_API_KEY=AIzaSyBNP6... (já temos)
VITE_API_URL=https://mariafaz.vercel.app
NODE_ENV=production
```

### 4️⃣ Estrutura de APIs no Vercel

**Verificar/Criar arquivos em `/api`**:
- ✅ `/api/health.ts` (existe)
- ✅ `/api/status.ts` (existe)
- ❌ `/api/auth/*` (faltando)
- ❌ `/api/properties/*` (faltando)
- ❌ `/api/ocr/*` (faltando)

### 5️⃣ Ordem de Execução

1. **Configurar DATABASE_URL** (5 min)
2. **Adicionar todas variáveis** (10 min)
3. **Corrigir AnimatePresence** (15 min)
4. **Criar endpoints API** (30 min)
5. **Testar funcionalidades** (20 min)

## 🚀 Comandos Úteis

### Para verificar variáveis localmente:
```bash
vercel env pull .env.local
```

### Para adicionar variáveis:
```bash
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

### Para fazer deploy após correções:
```bash
vercel --prod
```

### Para ver logs:
```bash
vercel logs --follow
```

## 📋 Checklist Final

- [ ] DATABASE_URL configurada no Vercel
- [ ] Todas variáveis de ambiente configuradas
- [ ] AnimatePresence error corrigido
- [ ] APIs funcionando em produção
- [ ] Login/Autenticação testado
- [ ] CRUD de propriedades testado
- [ ] Importação PDF testada
- [ ] Assistente AI testado

## 💡 Próximos Passos Imediatos

1. **Acesse o Vercel agora**: https://vercel.com/dashboard
2. **Configure DATABASE_URL** primeiro
3. **Adicione as outras variáveis**
4. **Faça redeploy**
5. **Teste o site**

## 🆘 Se Precisar de Ajuda

1. Para criar novo Neon DB: https://neon.tech/docs/get-started-with-neon/signing-up
2. Para configurar Vercel: https://vercel.com/docs/environment-variables
3. Para debugar: Use `vercel logs` para ver erros em tempo real

---

**Tempo estimado**: 1-2 horas para resolver todos os problemas
**Prioridade**: DATABASE_URL é crítica - sem ela nada funciona!