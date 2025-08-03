# 🚨 CONFIGURAR DATABASE_URL - ÚLTIMO PASSO!

## ✅ O Que Já Foi Configurado no Vercel

Acabei de adicionar estas variáveis:
- ✅ SESSION_SECRET 
- ✅ VITE_API_URL
- ✅ MISTRAL_API_KEY
- ✅ OPENROUTER_API_KEY  
- ✅ GOOGLE_GEMINI_API_KEY

## ❌ Falta Apenas: DATABASE_URL

### Opção 1: Criar Nova Base de Dados Neon (5 minutos)

1. **Acede a**: https://neon.tech
2. **Cria conta gratuita** (pode usar Google/GitHub)
3. **Cria novo projeto**:
   - Nome: `mariafaz`
   - Região: Escolhe a mais próxima
4. **Copia a connection string** (aparece logo após criar)
5. **Adiciona ao Vercel**:
   ```bash
   echo "postgresql://..." | vercel env add DATABASE_URL production
   ```

### Opção 2: Usar Railway (Alternativa)

1. **Acede a**: https://railway.app
2. **Cria conta gratuita**
3. **New Project** > **PostgreSQL**
4. **Copia DATABASE_URL** do painel
5. **Adiciona ao Vercel** (comando acima)

### Opção 3: Usar Supabase (Gratuito)

1. **Acede a**: https://supabase.com
2. **Start your project**
3. **Cria projeto** com nome `mariafaz`
4. **Settings** > **Database** > **Connection string**
5. **Adiciona ao Vercel** (comando acima)

## 🚀 Após Adicionar DATABASE_URL

Execute este comando para fazer redeploy:

```bash
vercel --prod
```

## 📊 Verificar Variáveis

Para confirmar que todas estão configuradas:

```bash
vercel env ls
```

Deve mostrar:
- DATABASE_URL
- SESSION_SECRET
- VITE_API_URL
- MISTRAL_API_KEY
- OPENROUTER_API_KEY
- GOOGLE_GEMINI_API_KEY

## ⏱️ Tempo Total

- Criar base de dados: 3-5 minutos
- Adicionar ao Vercel: 1 minuto
- Redeploy: 2-3 minutos

**Total**: ~10 minutos para site 100% funcional!

---

**IMPORTANTE**: Escolhe uma das opções acima e adiciona a DATABASE_URL. É o último passo!