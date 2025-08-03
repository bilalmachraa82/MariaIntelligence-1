# 🎭 Playwright MCP - Guia de Configuração e Uso

## ✅ Configuração Adicionada

O Playwright MCP foi adicionado ao projeto com sucesso!

### 📋 Configuração Adicionada:
```json
{
  "mcpServers": {
    "playwright-mcp": {
      "command": "wsl",
      "args": [
        "npx",
        "-y",
        "@smithery/cli@latest",
        "run",
        "@cloudflare/playwright-mcp",
        "--key",
        "da60059a-5384-43a1-a941-0a88c3197fd0",
        "--profile",
        "numerous-mackerel-ASTWTK"
      ]
    }
  }
}
```

## 🚀 Como Usar o Playwright MCP

### 1. Navegar para uma página:
```javascript
// No Claude Code
mcp__playwright-mcp__navigate {
  url: "https://mariafaz.vercel.app"
}
```

### 2. Tirar screenshot:
```javascript
mcp__playwright-mcp__screenshot {
  fullPage: true
}
```

### 3. Extrair texto da página:
```javascript
mcp__playwright-mcp__extract_text {
  selector: "body" // ou selector específico
}
```

### 4. Clicar em elementos:
```javascript
mcp__playwright-mcp__click {
  selector: "button.login"
}
```

### 5. Preencher formulários:
```javascript
mcp__playwright-mcp__fill {
  selector: "input[name='email']",
  value: "user@example.com"
}
```

## 🔍 Verificar o Site MariaFaz

Agora podes usar o Playwright MCP para verificar visualmente o site:

```javascript
// 1. Navegar para o site
mcp__playwright-mcp__navigate {
  url: "https://mariafaz.vercel.app"
}

// 2. Tirar screenshot
mcp__playwright-mcp__screenshot {
  fullPage: true
}

// 3. Extrair todos os textos do menu
mcp__playwright-mcp__extract_text {
  selector: "nav"
}
```

## 📍 Localização dos Arquivos

- **Configuração MCP**: `.claude/mcp-config.json`
- **Este guia**: `PLAYWRIGHT_MCP_GUIDE.md`

## ⚠️ Notas Importantes

1. O Playwright MCP usa WSL no Windows
2. Requer conexão à internet para funcionar
3. As chaves de API fornecidas são específicas do Smithery/Cloudflare
4. Para usar, o Claude Desktop precisa ser reiniciado após adicionar a configuração

## 🆘 Troubleshooting

Se o MCP não funcionar:
1. Verifica se o WSL está instalado e funcionando
2. Certifica-te que tens conexão à internet
3. Reinicia o Claude Desktop
4. Verifica os logs do Claude Desktop para erros

---

**Configuração adicionada com sucesso!** Agora podes usar o Playwright MCP para navegar e verificar visualmente o site.