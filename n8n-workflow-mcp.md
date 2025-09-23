# n8n Workflow com MCP - Fluxo de Reservas (Sem Slack)

## 📋 Visão Geral

Workflow completo para processamento automático de reservas de hotel usando OCR com Google Gemini, sem integração com Slack.

## 🔄 Estrutura do Fluxo

```
Webhook → Google Gemini (OCR) → PostgreSQL → Resposta
```

### Nodes do Workflow

1. **Webhook - Receber Reservas** (`n8n-nodes-base.webhook`)
   - Endpoint: `POST /reservas-ocr`
   - Recebe PDFs de reservas
   - Configurado com error handling

2. **Google Gemini - OCR PDF** (`@n8n/n8n-nodes-langchain.googleGemini`)
   - Modelo: `gemini-1.5-flash`
   - Extrai: nome, check-in, check-out, quarto, valor
   - Saída: JSON estruturado

3. **PostgreSQL - Salvar Dados** (`n8n-nodes-base.postgres`)
   - Schema: `public`
   - Tabela: `reservas`
   - Colunas: `nome_hospede, data_checkin, data_checkout, quarto, valor`

4. **Webhook - Resposta de Sucesso** (`n8n-nodes-base.respondToWebhook`)
   - Retorna confirmação de processamento

## 📁 Arquivos Criados

- `workflow-reservas-sem-slack.json` - Workflow completo e validado

## ⚙️ Configuração Necessária

### 1. Credenciais
- **Google Gemini**: Configurar API key
- **PostgreSQL**: Configurar conexão com banco de dados

### 2. Banco de Dados
```sql
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    nome_hospede VARCHAR(255),
    data_checkin DATE,
    data_checkout DATE,
    quarto VARCHAR(50),
    valor DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Teste do Webhook
```bash
curl -X POST http://seu-n8n/webhook/reservas-ocr \
  -F "file=@sua-reserva.pdf" \
  -H "Content-Type: multipart/form-data"
```

## ✅ Status de Validação

- ✅ Estrutura de conexões: Válida
- ✅ Nodes essenciais: Configurados
- ⚠️ Warnings: Apenas recomendações (sem impacto funcional)

## 🔧 Próximos Passos

1. Importar o workflow no n8n
2. Configurar credenciais
3. Criar tabela no PostgreSQL
4. Testar com PDF de reserva
5. Implementar monitoramento (opcional)

## 📊 Monitoramento Alternativo (sem Slack)

Como não usará Slack, considere:
- Logs do n8n
- Webhook de monitoramento
- Email notifications (se necessário)
- Dashboard do banco de dados