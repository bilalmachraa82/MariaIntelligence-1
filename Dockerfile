FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Imagem de produção
FROM node:20-alpine AS production

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5100

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar arquivos de build da etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expor porta
EXPOSE 5100

# Iniciar aplicação
CMD ["node", "dist/server/index.js"]
