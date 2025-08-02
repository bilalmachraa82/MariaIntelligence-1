# 🚨 LEMBRETE IMPORTANTE - WSL + GIT

## Problemas Comuns no WSL e Soluções

### 1. **Bus Error ao fazer commit**
```bash
# Se aparecer "Bus error (core dumped)"
rm -f .git/index.lock
git config --global core.autocrlf true
```

### 2. **Tokens expostos bloqueando push**
```bash
# NUNCA commitar arquivos com tokens!
# Adicionar ao .gitignore:
VALIDATION_REPORT.md
*_REPORT.md
*_SECURITY_REPORT.md
.env
.env.local
```

### 3. **Reset seguro se houver tokens em commits**
```bash
# Resetar últimos commits mantendo alterações
git reset --soft HEAD~N  # N = número de commits

# Adicionar apenas arquivos seguros
git add client/ server/ docs/ tests/ public/*.pdf
git add package.json tsconfig.json vercel.json

# Evitar arquivos temporários
git reset -- *.md check-*.js deploy-*.js setup-*.sh
```

### 4. **Verificar antes de push**
```bash
# Sempre verificar o que está sendo commitado
git status
git diff --staged

# Ver histórico antes de push
git log --oneline -5
```

### 5. **Configurações recomendadas para WSL**
```bash
# Line endings
git config --global core.autocrlf true

# Editor
git config --global core.editor "code --wait"

# Credenciais
git config --global credential.helper store
```

### 6. **Se o Vercel não atualizar**
1. Verificar se o push foi feito: `git log origin/main`
2. Verificar deploy no Vercel: https://vercel.com/dashboard
3. Ver logs de build no Vercel para erros

## 📋 Checklist antes de commit/push

- [ ] Remover todos os arquivos com tokens/secrets
- [ ] Verificar .gitignore está atualizado
- [ ] Fazer `git status` para ver o que será commitado
- [ ] Usar mensagens de commit descritivas
- [ ] Verificar se não há arquivos .lock do git
- [ ] Confirmar branch correto: `git branch`

## 🔧 Comandos úteis

```bash
# Ver configuração atual
git config --list

# Limpar cache se necessário
git rm -r --cached .
git add .
git commit -m "Clear git cache"

# Forçar push se necessário (CUIDADO!)
git push --force-with-lease origin main
```

---
**IMPORTANTE**: Sempre trabalhar com cuidado no WSL. Os erros de "Bus error" são comuns devido a problemas de memória ou filesystem.