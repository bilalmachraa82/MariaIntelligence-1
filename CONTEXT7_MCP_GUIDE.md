# 🧠 Context7 MCP - Guia de Configuração e Uso

## ✅ Configuração Adicionada

O Context7 MCP foi adicionado com sucesso ao arquivo de configuração!

### 📋 O que é o Context7 MCP?

Context7 é um MCP desenvolvido pela Upstash que fornece:
- **Memória persistente** para conversações
- **Busca semântica** em conteúdo anterior
- **Análise de contexto** para respostas mais relevantes
- **Cache inteligente** de informações importantes

### 🔧 Configuração Adicionada:
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
    },
    "context7-mcp": {
      "command": "wsl",
      "args": [
        "npx",
        "-y",
        "@smithery/cli@latest",
        "run",
        "@upstash/context7-mcp",
        "--key",
        "da60059a-5384-43a1-a941-0a88c3197fd0",
        "--profile",
        "numerous-mackerel-ASTWTK"
      ]
    }
  }
}
```

## 🚀 Como Usar o Context7 MCP

### 1. Armazenar contexto:
```javascript
mcp__context7-mcp__store {
  key: "project_mariafaz",
  value: "Projeto de gestão de propriedades em PT-PT com Vercel"
}
```

### 2. Recuperar contexto:
```javascript
mcp__context7-mcp__retrieve {
  key: "project_mariafaz"
}
```

### 3. Buscar informações:
```javascript
mcp__context7-mcp__search {
  query: "traduções português"
}
```

### 4. Listar contextos armazenados:
```javascript
mcp__context7-mcp__list {
  limit: 10
}
```

## 🎯 Casos de Uso para o MariaFaz

### 1. Armazenar estado do projeto:
```javascript
mcp__context7-mcp__store {
  key: "mariafaz_status",
  value: {
    "traduções": "completas",
    "database": "configurada",
    "deploy": "vercel",
    "problemas": ["cache", "i18n carregamento"]
  }
}
```

### 2. Guardar soluções aplicadas:
```javascript
mcp__context7-mcp__store {
  key: "mariafaz_fixes",
  value: {
    "i18n": "importado no App.tsx",
    "traduções": "19 chaves adicionadas",
    "database_url": "configurada no Vercel"
  }
}
```

## 📍 Status Atual

- **Playwright MCP**: ✅ Configurado
- **Context7 MCP**: ✅ Configurado
- **Localização**: `C:\Users\Bilal\AppData\Roaming\Claude\claude_desktop_config.json`

## ⚠️ Importante

1. **Reinicia o Claude Desktop** para ativar ambos os MCPs
2. Ambos usam **WSL** para execução no Windows
3. Requerem **conexão à internet**
4. As chaves são do **Smithery** (plataforma de MCPs)

## 🔄 Próximos Passos

1. **Fecha** o Claude Desktop completamente
2. **Abre** novamente
3. Os dois MCPs estarão disponíveis:
   - `mcp__playwright-mcp__*` - Para navegação visual
   - `mcp__context7-mcp__*` - Para memória persistente

---

**Configuração concluída!** Agora tens dois MCPs poderosos: Playwright para ver o site e Context7 para memória persistente.