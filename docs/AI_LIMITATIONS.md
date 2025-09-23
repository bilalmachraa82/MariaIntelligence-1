# Limitações Atuais de IA e OCR

Este documento resume o estado corrente das integrações de IA/OCR no projeto e as ações necessárias para executar todos os fluxos de ponta a ponta.

## Serviços Externos

- **Gemini, Mistral, OpenRouter e Hugging Face**: os testes e funcionalidades em tempo real ficam indisponíveis quando `AI_SERVICE_MODE` está configurado para `mock` (valor padrão). Forneça as chaves (`GOOGLE_GEMINI_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `HF_TOKEN`) e defina `AI_SERVICE_MODE=live` para habilitar as suites integradas.
- **Ambiente de testes**: as suites que dependem de `supertest`/`axios` para abrir portas locais só são executadas quando `ENABLE_FULL_STACK_TESTS=true`. Em ambientes sandboxed, elas serão automaticamente ignoradas.

## Fallback Nativo

- O parser nativo (`parseReservationData`) sempre retorna reservas com campos obrigatórios explícitos (`null`) quando os dados não são detectados. O array `missing` indica qual campo precisa ser preenchido manualmente na interface.
- Quando apenas o modo nativo é utilizado, espere valores:
  - `checkInDate` / `checkOutDate`: `null` até que uma data reconhecível seja encontrada.
  - `numGuests` e `totalAmount`: `null` se não houver números no texto original.
  - `notes`: preenchido com uma anotação indicando que o conteúdo veio do fallback nativo.

## Execução de Testes

- Execute `ENABLE_FULL_STACK_TESTS=true npm test` em ambientes onde seja possível abrir portas TCP.
- Execute `AI_SERVICE_MODE=live npm test` (com todas as chaves configuradas) para validar os fluxos integrados de IA.

## Próximos Passos Recomendados

1. Provisionar credenciais oficiais para cada fornecedor de IA.
2. Ativar um Redis gerenciado, caso contrário as sessões continuarão a usar o fallback em memória.
3. Configurar uma instância PostgreSQL real e atualizar `DATABASE_URL` para validar os casos de uso completos.
