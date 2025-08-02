# 🔍 Debug MCP Neon - Solução

## Problema Encontrado
- MCP configurado mas retorna "Transport is closed"
- API key retorna "Unauthorized" (401)
- A chave fornecida parece ser do Smithery, não do Neon

## Solução Passo a Passo

### 1. Obter API Key do Neon (2 min)
1. Acesse: https://console.neon.tech
2. Login com sua conta
3. Vá em: **Account Settings** → **API Keys**
4. Clique "Create API Key"
5. Copie a chave (formato: `neon_api_key_...`)

### 2. Testar API Key (1 min)
```bash
# Substitua YOUR_NEON_API_KEY pela sua chave
curl -H "Authorization: Bearer YOUR_NEON_API_KEY" \
     -H "Accept: application/json" \
     https://console.neon.tech/api/v2/projects
```

### 3. Se você já tem projeto Neon
Se a API funcionar e mostrar projetos:

```bash
# Pegar connection string do primeiro projeto
curl -H "Authorization: Bearer YOUR_NEON_API_KEY" \
     https://console.neon.tech/api/v2/projects | \
     grep -o '"connection_uri":"[^"]*"' | head -1
```

### 4. Configurar no Vercel manualmente
Como o MCP está com problemas, vamos direto:

1. **Copie a connection string** do passo 3
2. **Acesse Vercel**: https://vercel.com
3. **Settings → Environment Variables**
4. **Add**: DATABASE_URL = (sua connection string)
5. **Redeploy**

### 5. Executar setup
```bash
# Após redeploy
curl "https://mariafaz.vercel.app/api/setup-db?secret=mariafaz2024setup"
```

## Alternativa: Usar Neon CLI direto no WSL

```bash
# Instalar Neon CLI
npm i -g neonctl

# Login
neonctl auth

# Listar projetos
neonctl projects list

# Criar projeto se não tiver
neonctl projects create --name mariafaz-prod

# Pegar connection string
neonctl connection-string mariafaz-prod
```

## Por que MCP não está funcionando?

1. **Transport closed**: MCP precisa ser reiniciado após configuração
2. **Chave errada**: A chave fornecida é do Smithery (proxy), não do Neon
3. **WSL**: Pode haver conflito com o comando WSL aninhado

## Solução Rápida (10 min)

Esqueça o MCP por enquanto e:

1. Entre no Neon: https://console.neon.tech
2. Crie/encontre seu projeto
3. Copie connection string
4. Cole no Vercel
5. Execute o setup via browser

Isso tornará seu site 100% funcional!