# productContext.md

## Por que este projeto existe?
O Maria Faz foi criado para simplificar e automatizar a gestão de reservas de Alojamento Local (AL), especialmente para proprietários e gestores que lidam com múltiplas fontes de reservas em formatos variados (PDF, imagens).

## Problemas que resolve
- Processamento manual e demorado de reservas recebidas em PDF ou imagem.
- Falta de integração entre diferentes sistemas de reservas.
- Dificuldade em extrair dados estruturados de documentos enviados por hóspedes ou plataformas.
- Necessidade de uma interface acessível e responsiva para uso em dispositivos móveis.

## Como deve funcionar
- O usuário faz upload de arquivos PDF ou imagens de reservas.
- O sistema utiliza OCR (Mistral‑OCR via OpenRouter, RolmOCR para manuscritos) para extrair e estruturar os dados.
- Os dados extraídos são armazenados em um banco PostgreSQL e apresentados em uma interface mobile‑first.
- O sistema deve ser rápido (processamento <5s) e preparado para multi‑tenant em versões futuras.

## Objetivos de experiência do usuário
- Upload simples e rápido de arquivos.
- Visualização clara e organizada das reservas processadas.
- Feedback imediato sobre o status do processamento.
- Facilidade de uso em dispositivos móveis.
