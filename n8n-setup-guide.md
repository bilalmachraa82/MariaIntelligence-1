# Guia de Configuração n8n para Maria Faz

## Vantagens da Integração n8n

### Problemas Resolvidos
- **Complexidade reduzida**: Um único fluxo visual em vez de múltiplos serviços
- **Confiabilidade**: Retry automático e error handling robusto
- **Monitorização**: Dashboard completo de execuções e logs
- **Manutenção**: Alterações no fluxo sem mexer no código

### Comparação com Sistema Atual
```
ANTES (Sistema Atual):
Website → Multiple AI Services → Complex Error Handling → Database
- 5+ serviços de IA diferentes
- Código disperso em múltiplos arquivos
- Debugging complexo
- Falhas frequentes

DEPOIS (com n8n):
Website → n8n Webhook → AI Processing → Database
- Fluxo visual único
- Error handling centralizado
- Logs detalhados
- Execução confiável
```

## Configuração Passo a Passo

### 1. Instalação do n8n

#### Opção A: Docker (Recomendado)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Opção B: npm Global
```bash
npm install -g n8n
n8n start
```

### 2. Configuração Inicial

1. Acesse `http://localhost:5678`
2. Crie conta de administrador
3. Configure credenciais necessárias

### 3. Configurar Credenciais

#### PostgreSQL Database
- **Nome**: `Maria Faz Database`
- **Host**: `seu-host-postgresql`
- **Database**: `nome-da-database`
- **User**: `usuario`
- **Password**: `senha`

#### OpenAI API
- **Nome**: `OpenAI API`
- **API Key**: `sk-...` (sua chave OpenAI)

#### Webhook Authentication
- **Nome**: `Maria Faz Webhook Auth`
- **Username**: `maria-faz`
- **Password**: `senha-segura`

### 4. Importar Workflow

1. Vá para **Workflows** → **Import from File**
2. Selecione o arquivo `n8n-workflow-template.json`
3. Configure as credenciais em cada nó
4. Ative o workflow

### 5. Configurar Website

#### Variáveis de Ambiente
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/maria-faz-pdf
N8N_WEBHOOK_SECRET=maria-faz-secret
```

#### Testar Integração
```bash
# Verificar status
curl http://localhost:5000/api/n8n/status

# Testar upload (substitua por arquivo real)
curl -X POST -F "pdf=@teste.pdf" http://localhost:5000/api/n8n/process-pdf
```

## Workflow Detalhado

### Fluxo de Processamento

1. **Webhook Trigger**: Recebe PDF do website
2. **File Processor**: Extrai dados do arquivo
3. **AI Extraction**: Usa OpenAI Vision para OCR
4. **Data Validator**: Valida e normaliza dados
5. **Find Property**: Encontra propriedade na database
6. **Prepare Insert**: Prepara queries de inserção
7. **Insert Reservations**: Insere reservas na database
8. **Response Handler**: Retorna resultado
9. **Error Handler**: Trata erros e retorna feedback

### Configurações Avançadas

#### Retry Policy
```json
{
  "retryOnFail": true,
  "maxRetries": 3,
  "waitBetween": 1000
}
```

#### Timeout Configuration
```json
{
  "timeout": 60000,
  "continueOnFail": false
}
```

## Monitorização e Debugging

### Dashboard n8n
- **Executions**: Histórico completo de processamentos
- **Logs**: Logs detalhados de cada step
- **Performance**: Métricas de tempo de execução
- **Errors**: Análise de falhas com stack traces

### Alertas
Configure alertas para:
- Falhas de processamento
- Timeouts
- Erros de database
- Problemas de conectividade

## Migração do Sistema Atual

### Fase 1: Setup Paralelo
1. Configurar n8n
2. Importar workflow
3. Testar com PDFs de exemplo
4. Validar resultados

### Fase 2: Integração Gradual
1. Adicionar endpoint n8n no website
2. Criar toggle para escolher sistema
3. Testar com dados reais
4. Comparar resultados

### Fase 3: Migração Completa
1. Definir n8n como padrão
2. Manter sistema antigo como fallback
3. Monitorizar por 1 semana
4. Remover código antigo

## Benefícios Esperados

### Performance
- **Velocidade**: 2-3x mais rápido que sistema atual
- **Confiabilidade**: 95%+ taxa de sucesso
- **Escalabilidade**: Processa múltiplos PDFs simultaneamente

### Manutenção
- **Debugging**: Logs visuais detalhados
- **Modificações**: Drag-and-drop interface
- **Monitoring**: Dashboard real-time
- **Backup**: Export/import de workflows

### Custos
- **Redução de código**: -70% linhas de código OCR
- **Manutenção**: -50% tempo de debugging
- **Hospedagem**: n8n cloud ou self-hosted

## Próximos Passos

1. **Instalar n8n**: Docker ou npm
2. **Importar workflow**: Usar template fornecido
3. **Configurar credenciais**: Database e APIs
4. **Testar integração**: Endpoint webhook
5. **Migrar gradualmente**: Manter sistema atual como backup

## Suporte e Documentação

- **n8n Docs**: https://docs.n8n.io/
- **Community**: https://community.n8n.io/
- **Examples**: https://n8n.io/workflows/

Esta integração vai simplificar significativamente o processamento de PDFs e dar muito mais controle sobre o fluxo de dados.