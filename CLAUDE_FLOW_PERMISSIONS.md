# Configuração de Autorizações Automáticas do Claude Flow

Este documento explica como configurar o Claude Flow para ter todas as autorizações necessárias e evitar pedidos constantes de permissões.

## 🚀 Configuração Rápida

Para aplicar todas as configurações automaticamente, execute:

```bash
./setup-claude-flow-permissions.sh
```

## 📁 Arquivos de Configuração

### 1. `claude-flow.config.json`
Arquivo principal de configuração do Claude Flow com:
- **Auto-aprovação ativada**: `"auto_approve": true`
- **Confirmações desabilitadas**: `"require_confirmation": false`
- **Operações seguras permitidas**: file_operations, code_generation, testing, etc.
- **Comandos permitidos**: npm, git, node, curl localhost, etc.
- **Comandos bloqueados**: rm -rf /, sudo, chmod 777, etc.

### 2. `.claude/settings.json`
Configurações específicas do Claude Desktop:
- Lista expandida de comandos permitidos
- Permissões para operações de arquivo
- Auto-aprovação para comandos seguros

### 3. `.claude/claude_desktop_config.json`
Configurações globais do Claude Desktop:
- Configurações de MCP servers
- Níveis de confiança
- Permissões de rede e sistema de arquivos

### 4. Variáveis de Ambiente (`.env`)
```bash
CLAUDE_FLOW_AUTO_APPROVE=true
CLAUDE_FLOW_REQUIRE_CONFIRMATION=false
CLAUDE_FLOW_SAFE_MODE=false
```

## ✅ Operações Permitidas Automaticamente

### Comandos de Desenvolvimento
- `npm run *`, `npx *`, `yarn *`, `pnpm *`
- `node *`, `tsc *`, `jest *`, `vitest *`
- `eslint *`, `prettier *`

### Comandos Git
- `git *` (todos os comandos git)

### Comandos de Sistema (Seguros)
- `ls *`, `pwd`, `cat *`, `grep *`, `find *`
- `mkdir *`, `touch *`, `cp *`, `mv *`
- `echo *`, `which *`, `jq *`

### Operações de Arquivo
- Leitura, escrita e edição de arquivos
- Criação e modificação de código
- Operações de busca e navegação

### Rede Local
- `curl localhost:*`
- `curl 127.0.0.1:*`
- `curl http://localhost:*`

## ❌ Operações Bloqueadas

### Comandos Perigosos
- `rm -rf /`
- `sudo *`
- `chmod 777 *`
- `curl * | bash`
- `wget * | sh`
- `eval *`, `exec *`

### Operações Restritas
- Migrações de banco de dados
- Deploy em produção
- Comandos de administração do sistema

## 🔧 Como Aplicar as Configurações

### Método 1: Script Automático
```bash
# Tornar o script executável
chmod +x setup-claude-flow-permissions.sh

# Executar o script
./setup-claude-flow-permissions.sh
```

### Método 2: Manual
1. Copie os arquivos de configuração para seus locais corretos
2. Adicione as variáveis de ambiente ao `.env`
3. Reinicie o Claude Desktop

### Método 3: Variáveis de Ambiente
```bash
# Adicionar ao seu .bashrc, .zshrc ou .env
export CLAUDE_FLOW_AUTO_APPROVE=true
export CLAUDE_FLOW_REQUIRE_CONFIRMATION=false
export CLAUDE_FLOW_SAFE_MODE=false

# Aplicar as variáveis
source .env
```

## 🔄 Reinicialização

Após aplicar as configurações:

1. **Reinicie o Claude Desktop** para aplicar as configurações globais
2. **Recarregue o projeto** no IDE
3. **Execute `source .env`** para aplicar variáveis de ambiente

## ⚠️ Considerações de Segurança

### Ambientes Recomendados
- ✅ Desenvolvimento local
- ✅ Projetos pessoais
- ✅ Ambientes de teste

### Ambientes NÃO Recomendados
- ❌ Produção
- ❌ Servidores compartilhados
- ❌ Projetos com dados sensíveis

### Riscos
- **Execução automática de comandos**: O Claude pode executar comandos sem confirmação
- **Acesso ao sistema de arquivos**: Permissões amplas para leitura/escrita
- **Operações de rede local**: Acesso a serviços localhost

## 🐛 Solução de Problemas

### Claude ainda pede permissões
1. Verifique se todos os arquivos de configuração existem
2. Reinicie o Claude Desktop
3. Verifique as variáveis de ambiente: `echo $CLAUDE_FLOW_AUTO_APPROVE`

### Comandos específicos bloqueados
1. Adicione o comando à lista `allow` em `.claude/settings.json`
2. Verifique se não está na lista `deny`
3. Reinicie o Claude Desktop

### Configurações não aplicadas
1. Verifique a sintaxe JSON dos arquivos de configuração
2. Confirme que os arquivos estão nos locais corretos
3. Verifique as permissões dos arquivos

## 📝 Personalização

Para adicionar novos comandos permitidos, edite `.claude/settings.json`:

```json
"allow": [
  "Bash(seu-comando *)",
  // ... outros comandos
]
```

Para bloquear comandos específicos:

```json
"deny": [
  "Bash(comando-perigoso *)",
  // ... outros comandos
]
```

## 🔗 Links Úteis

- [Documentação oficial do Claude Flow](https://docs.claude.ai/flow)
- [Configurações do Claude Desktop](https://docs.claude.ai/desktop)
- [Guia de segurança](https://docs.claude.ai/security)

---

**Nota**: Estas configurações priorizam a conveniência sobre a segurança. Use com responsabilidade e apenas em ambientes de desenvolvimento confiáveis.