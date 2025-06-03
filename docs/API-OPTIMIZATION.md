# Otimização de APIs - Maria Faz

## Configuração Atual (Redundante)
- `GOOGLE_API_KEY` + `GOOGLE_GEMINI_API_KEY` (duplicadas)
- `OPENROUTER_API_KEY` (Mistral OCR)
- `HF_TOKEN` (Hugging Face RolmOCR)

## Configuração Otimizada (Harmoniosa)
**Apenas 1 secret necessário:**
- `GOOGLE_API_KEY` (Google Gemini 2.5 Flash)

## Por que esta otimização?

### Google Gemini 2.5 Flash oferece tudo:
✓ **OCR avançado** - Processamento de documentos PDF
✓ **Chat inteligente** - Assistente virtual Maria
✓ **Análise de dados** - Extração de informações estruturadas
✓ **Visão computacional** - Processamento de imagens
✓ **Multilíngue** - Suporta português e inglês

### Benefícios da simplificação:
- **Menos configuração** - 1 chave em vez de 3-4
- **Menos custos** - 1 conta API em vez de múltiplas
- **Menos complexidade** - 1 serviço para manter
- **Melhor performance** - Sem fallbacks desnecessários
- **Mais confiável** - Google tem 99.9% uptime

## Implementação

### Secrets necessários:
```
GOOGLE_API_KEY=sua_chave_do_gemini_aqui
```

### Todas as funcionalidades funcionam:
- Upload e processamento de PDFs
- Assistente virtual Maria
- Extração de dados de reservas
- Chat inteligente
- Análise de documentos

## Migração

As configurações antigas continuam funcionando por compatibilidade, mas a nova configuração simplificada é recomendada para novos deployments.