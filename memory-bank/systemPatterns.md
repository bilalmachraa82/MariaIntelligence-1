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

- Upload e processamento rápido de arquivos (<5s).
- Extração confiável de dados estruturados via OCR.
- Sincronização entre processamento backend e atualização da UI.

## Observações

- Este arquivo deve ser atualizado conforme padrões e decisões evoluírem durante o desenvolvimento.
