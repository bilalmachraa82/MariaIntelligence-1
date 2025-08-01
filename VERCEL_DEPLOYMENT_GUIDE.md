# 🚀 Guia de Deploy do Maria Faz no Vercel

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [GitHub](https://github.com)
3. Chave API do Google Gemini (para funcionalidades de IA)
4. Base de dados PostgreSQL (pode usar Neon, Supabase, ou outro)

## 🔧 Passos para Deploy

### 1. Push do Código para GitHub

Como não consegues fazer push diretamente, faz o seguinte:

```bash
# Opção 1: Configurar credenciais do Git
git config --global user.name "bilalmachraa82"
git config --global user.email "teu-email@example.com"

# Opção 2: Usar GitHub Desktop ou VSCode para fazer push
# Ou fazer upload manual via interface web do GitHub
```

### 2. Importar Projeto no Vercel

1. Acede a [vercel.com](https://vercel.com)
2. Clica em "New Project"
3. Seleciona "Import Git Repository"
4. Escolhe o repositório: `bilalmachraa82/MariaIntelligence-1`
5. Seleciona o branch: `main`

### 3. Configurar Build Settings

No Vercel, configura:

- **Framework Preset**: `Other`
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm cache clean --force && npm install --legacy-peer-deps`
- **Node Version**: `20.x`

### 4. Variáveis de Ambiente

Adiciona estas variáveis no Vercel (Settings > Environment Variables):

```bash
# Obrigatórias
DATABASE_URL=postgresql://neondb_owner:npg_5HAIWZB9tncz@ep-tiny-dream-a58ddhin.us-east-2.aws.neon.tech/neondb?sslmode=require
GOOGLE_GEMINI_API_KEY=[tua chave Gemini]
SESSION_SECRET=[gerar uma string aleatória]
NODE_ENV=production

# Opcionais (se usares email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=[teu email]
EMAIL_PASS=[password de app]
```

### 5. Deploy

1. Clica em "Deploy"
2. Aguarda o build (2-3 minutos)
3. O Vercel fornecerá um URL tipo: `https://maria-faz.vercel.app`

## 🎯 Verificação Pós-Deploy

### Testar Endpoints:
- Frontend: `https://teu-app.vercel.app`
- Health Check: `https://teu-app.vercel.app/api/health`
- Status: `https://teu-app.vercel.app/api/status`

### Funcionalidades a Verificar:
- [ ] Dashboard carrega corretamente
- [ ] Login/autenticação funciona
- [ ] Upload de PDFs processa
- [ ] Gestão de propriedades
- [ ] Relatórios financeiros
- [ ] Multi-idiomas funciona

## 🔍 Troubleshooting

### Se o build falhar:
1. Verifica os logs no Vercel
2. Confirma que todas as variáveis de ambiente estão definidas
3. Tenta com Node.js 18.x se 20.x falhar

### Se a app não funcionar:
1. Verifica a consola do browser (F12)
2. Confirma que a base de dados está acessível
3. Verifica os logs de função no Vercel

## 📱 Acesso Mobile

A aplicação está otimizada para mobile e pode ser instalada como PWA:
1. Acede ao site no telemóvel
2. Chrome/Safari: Menu > "Adicionar ao ecrã inicial"
3. A app funcionará como nativa

## 🔐 Segurança

- Nunca exponhas as chaves API no código
- Usa sempre HTTPS
- Mantém as dependências atualizadas
- Ativa 2FA no GitHub e Vercel

## 📞 Suporte

Se tiveres problemas:
1. Verifica a documentação do Vercel
2. Consulta os logs de erro
3. Revê as configurações de ambiente

---

**Nota**: Este projeto está configurado como SPA (Single Page Application) com roteamento client-side. O Vercel redirecionará todas as rotas para index.html automaticamente.