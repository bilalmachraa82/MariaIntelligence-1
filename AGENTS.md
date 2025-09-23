# AGENTS.md

Este ficheiro serve como um guia para os agentes de IA que colaboram neste repositório. Fornece o contexto e as instruções necessárias para garantir uma colaboração eficaz e consistente.

## Agentes de IA Designados

Este projeto utiliza os seguintes agentes de IA para revisão, desenvolvimento e finalização:

- **Claude Code:** Utilizado para análise estática, otimização de código e implementação de novas funcionalidades.
- **Claude Flow:** Responsável pela orquestração de tarefas, automação de fluxos de trabalho de CI/CD e gestão de dependências.

## 1. Configuração do Ambiente de Desenvolvimento

Para configurar o ambiente de desenvolvimento, siga estes passos:

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Variáveis de ambiente:**
    Copie o ficheiro `.env.example` para `.env` e preencha as variáveis necessárias.

## 2. Diretrizes de Teste

A execução de testes é crucial para manter a qualidade do código.

- **Executar testes unitários:**
  ```bash
  npm test
  ```

- **Linting:**
  Para verificar o estilo do código, execute:
  ```bash
  npm run lint
  ```

## 3. Estilo de Código e Convenções

O projeto segue as seguintes convenções de código:

- **Formatação:** Usamos o Prettier para formatação automática.
- **Nomenclatura de commits:** Seguimos a especificação de [Conventional Commits](https://www.conventionalcommits.org/).
- **Estilo de código:** Adira às regras definidas no ficheiro `.eslintrc.js`.

## 4. Instruções para Pull Requests (PRs)

- **Títulos dos PRs:** Devem seguir o padrão de Conventional Commits.
- **Descrição:** A descrição do PR deve incluir um resumo das alterações e o contexto relevante.
- **Revisão:** Todos os PRs devem ser revistos por pelo menos um outro membro da equipa (humano ou IA) antes de serem fundidos.
