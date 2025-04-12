# Migração Mistral → Google Gemini

## Visão Geral

Este documento detalha a migração realizada do serviço Mistral AI para o Google Gemini, incluindo as mudanças de código, testes realizados e o componente de verificação de status implementado.

## Justificativa da Migração

A migração do Mistral para o Google Gemini foi implementada pelas seguintes razões:

1. **Mais modelos disponíveis**: O Google Gemini oferece 17 modelos diferentes, permitindo escolher o mais adequado para cada tipo de tarefa.
2. **Melhor suporte a visão computacional**: Capacidade avançada de processamento de imagens para análise de documentos PDF.
3. **Maior estabilidade da API**: Interface mais estável e consistente para integrações.
4. **Melhor desempenho**: Respostas mais rápidas e precisas, especialmente para extração de dados de documentos.

## Principais Mudanças

### 1. Estrutura de Adaptador de Serviço

Foi implementado um padrão adaptador que permite alternar entre diferentes serviços de AI sem modificar o código do cliente:

- `AIAdapter`: Classe principal que gerencia qual serviço está ativo
- `GeminiService`: Implementação específica para a API do Google Gemini
- `MistralService`: Implementação anterior (mantida para compatibilidade temporária)

### 2. Endpoint de Verificação de Status

Foi criado um novo endpoint para verificar o status dos serviços de IA:

```
GET /api/check-ai-services
```

Retorna:
```json
{
  "success": true,
  "currentService": "gemini",
  "services": {
    "gemini": {
      "status": "active",
      "models": 17,
      "description": "Google AI service"
    },
    "mistral": {
      "status": "deprecated",
      "models": 5,
      "description": "Service replaced by Google Gemini"
    }
  }
}
```

### 3. Componente de UI para Status do Serviço

Foi desenvolvido um componente React (`AIServiceStatus`) que exibe o status atual dos serviços de IA:

- Localizado em: `client/src/components/ai-service-status.tsx`
- Integrado na página de configurações: `client/src/pages/settings/index.tsx`
- Totalmente traduzido em português e inglês

## Testes Realizados

1. **Verificação de conexão**: Teste de conectividade com a API do Google Gemini
2. **Teste de modelos**: Verificação de disponibilidade dos 17 modelos Gemini
3. **Comparação de performance**: Análise de tempo de resposta e precisão na extração de dados
4. **Processamento de PDFs**: Teste de extração de dados de documentos de reserva
5. **Function calling**: Teste de uso da capacidade de chamada de função para estruturar dados

## Configuração

### Variáveis de Ambiente

Para utilizar o serviço Gemini, é necessário configurar a seguinte variável de ambiente:

```
GEMINI_API_KEY=sua_chave_aqui
```

A chave antiga do Mistral (`MISTRAL_API_KEY`) ainda é mantida para compatibilidade, mas não é mais o serviço principal.

### Configuração do Serviço

O serviço atual pode ser alterado através do objeto de configuração em `server/config.ts`:

```typescript
export const aiConfig = {
  defaultService: 'gemini', // Opções: 'gemini', 'mistral'
  // ...outras configurações
};
```

## Trabalhos Futuros

1. **Remoção completa do Mistral**: Plano para remover completamente o suporte a Mistral em versão futura
2. **Expansão de capacidades de visão**: Melhorar o processamento de documentos com recursos avançados de visão do Gemini
3. **Implementação de streaming**: Implementar respostas em streaming para interações mais fluidas no assistente

## Solução de Problemas

### Erros Comuns

- **Erro 401**: Chave de API inválida ou expirada. Verifique a configuração de `GEMINI_API_KEY`.
- **Erro 403**: Limitações da API foram atingidas. Verifique os limites da sua conta Google AI.
- **Erro 404**: Modelo solicitado não encontrado. Verifique se está solicitando um modelo válido.

### Verificação de Status

Para verificar o status atual dos serviços de IA:

1. Acesse a página de configurações → guia "Integrações"
2. Verifique o componente "Status dos Serviços de IA"
3. Alternativelmente, faça uma requisição GET para `/api/check-ai-services`