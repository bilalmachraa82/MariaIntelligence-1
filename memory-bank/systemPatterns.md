# systemPatterns.md

## Arquitetura do Sistema

- **Backend:** Node.js 18 com Fastify, responsável por APIs, processamento de arquivos e integração com OCR.
- **Frontend:** React com Vite, interface mobile-first para upload e visualização de reservas.
- **OCR:** Mistral-OCR via OpenRouter para PDFs/imagens digitais; RolmOCR para manuscritos.
- **Banco de Dados:** PostgreSQL, centralizando dados extraídos e informações de reservas.
- **Deploy:** Railway (API/backend) e Netlify (frontend).

## Decisões Técnicas

- Separação clara entre backend (API/processamento) e frontend (UI).
- Utilização de AI/OCR como serviço externo, desacoplado do core do backend.
- Estrutura preparada para multi-tenant em versões futuras.
- Interface mobile-first como prioridade de UX.

## Padrões de Design

- Modularização de componentes React.
- Utilização de hooks para lógica de upload e processamento.
- Organização de rotas e controladores no backend por domínio funcional.
- Uso de filas (BullMQ) para processamento assíncrono e retries de OCR.

## Caminhos Críticos de Implementação

- Upload e processamento rápido de arquivos (<5s) - **Implementado**
- Extração confiável de dados estruturados via OCR - **Implementado com BullMQ para retentativas**
- Sincronização entre processamento backend e atualização da UI - **Implementado com React Query**
- Testes unitários e end-to-end - **Parcialmente implementado (com problemas de tipo)**
- Sistema de filas para processamento assíncrono - **Implementado com BullMQ e Redis**
- Tratamento de erros e retentativas - **Implementado**

## Soluções de Teste

- **Unitários:** Jest + ts-jest para testes de API
- **E2E:** Playwright para testes de interação do usuário
- **Integração:** GitHub Actions para integração contínua
- **Mock:** Mock de storage e AI adapters para testes isolados

## Problemas Pendentes

- Erros de tipo no `storage.ts` afetam a execução dos testes
- Testes E2E exigem ambiente com uploads previamente configurados

## Observações

- Sistema operacional mesmo com testes incompletos
- Arquitetura demonstrou resiliência com uso de filas e retentativas
- Padrões de design modular facilitam manutenção e extensão
