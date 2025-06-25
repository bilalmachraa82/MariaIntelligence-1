# Proposta de Integração com n8n para Processamento de PDFs

## Problemas Atuais
1. **Múltiplos serviços de IA**: Gemini, OpenRouter, Mistral - complexidade desnecessária
2. **Processamento inconsistente**: Falhas frequentes na extração de dados
3. **Código disperso**: Múltiplos endpoints e serviços para o mesmo objetivo
4. **Falta de controle**: Difícil debugar e monitorizar o processo

## Arquitetura Proposta com n8n

### Fluxo Principal
```
Website → Webhook n8n → Processamento IA → Database → Response
```

### Componentes n8n

#### 1. Webhook Trigger
- **URL**: `https://sua-instancia-n8n.com/webhook/maria-faz-pdf`
- **Método**: POST
- **Dados**: File upload (multipart/form-data)

#### 2. Nós de Processamento
1. **File Processor** - Converte PDF para base64
2. **AI Service** - Usa OpenAI/Gemini para OCR e extração
3. **Data Validator** - Valida e normaliza dados extraídos
4. **Database Writer** - Insere reservas na base de dados
5. **Response Handler** - Retorna resultado para o website

### Vantagens
- **Simplicidade**: Um único fluxo visual e controlável
- **Confiabilidade**: Retry automático, error handling
- **Monitorização**: Dashboard completo de execuções
- **Flexibilidade**: Fácil modificar o fluxo sem código
- **Debugging**: Logs detalhados de cada step

## Implementação

### 1. Endpoint Webhook no Website
```typescript
// Novo endpoint simplificado
app.post("/api/process-pdf-webhook", async (req, res) => {
  // Envia PDF para n8n e aguarda resposta
  // Muito mais simples que o sistema atual
});
```

### 2. Fluxo n8n Detalhado

#### Nó 1: Webhook Trigger
- Recebe arquivo PDF
- Extrai metadados (nome, tamanho, tipo)

#### Nó 2: PDF to Text
- Usa serviço OCR (OpenAI Vision/Gemini)
- Fallback para pdf-parse se necessário

#### Nó 3: AI Extraction
- Prompt estruturado para extrair dados de reserva
- JSON Schema validation
- Retry com diferentes prompts se falhar

#### Nó 4: Data Processing
- Normaliza datas, valores monetários
- Valida campos obrigatórios
- Enriquece com dados default

#### Nó 5: Database Integration
- Conecta à PostgreSQL
- Insere reservas validadas
- Gera relatório de sucesso/erro

#### Nó 6: Response
- Retorna dados estruturados para o website
- Inclui estatísticas e logs

### 3. Configuração n8n

#### Environment Variables
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
WEBSITE_WEBHOOK_SECRET=...
```

#### Workflow JSON Export
Será criado um template completo exportável.

### 4. Alterações no Website

#### Frontend
- Simplificar componente de upload
- Mostrar progress bar durante processamento
- Melhor handling de erros

#### Backend  
- Remover código OCR complexo atual
- Endpoint simples que chama n8n
- Cache de resultados

## Cronograma de Implementação

### Fase 1 (1-2 dias)
- Configurar instância n8n
- Criar workflow básico
- Testar com PDF simples

### Fase 2 (2-3 dias)
- Implementar todos os nós de processamento
- Integrar com base de dados
- Testes extensivos

### Fase 3 (1 dia)
- Modificar frontend/backend
- Migração gradual
- Testes finais

### Fase 4 (1 dia)
- Deploy em produção
- Monitorização
- Cleanup código antigo

## Benefícios Esperados

1. **Redução de 70% do código** relacionado a OCR
2. **Maior confiabilidade** - retry automático
3. **Melhor debugging** - logs visuais
4. **Manutenção simplificada** - tudo no n8n
5. **Escalabilidade** - n8n cloud handles load

## Próximos Passos

1. Quer que implemente o endpoint webhook no website?
2. Precisa de ajuda para configurar a instância n8n?
3. Devo criar o workflow template completo?

Esta abordagem vai resolver os problemas atuais e dar muito mais controle sobre o processo.