# Proposta de Reorganização da Navegação do Sistema Maria Faz

## Princípios de Design Aplicados

1. **Mobile-First**: Interface otimizada primariamente para dispositivos móveis com menus simplificados.
2. **Organização Contextual**: Agrupamento de funcionalidades por contexto e relevância para o usuário.
3. **Simplicidade Visual**: Redução de elementos visuais e texto para focar no essencial.
4. **Hierarquia de Navegação**: Estrutura claramente definida com itens frequentes mais acessíveis.
5. **Terminologia Simplificada**: Termos mais curtos e intuitivos para facilitar a navegação.

## Estrutura de Navegação Proposta

### Camada Principal (Core)
Representa as funções mais utilizadas no dia-a-dia, visíveis diretamente:

* **Home** (Dashboard) - Visão geral rápida
* **Imóveis** (Propriedades) - Gestão de propriedades
* **Reservas** - Calendário e gestão de reservas

### Finanças
Tudo relacionado a dinheiro e finanças:

* **Financeiro** - Relatórios financeiros por proprietário
* **Faturas** - Faturação mensal 
* **Entradas** - Pagamentos recebidos
* **Saídas** - Despesas e pagamentos a fornecedores

### Operações
Processos operacionais e gestão de pessoas:

* **Limpeza** - Equipas e serviços de limpeza
* **Manutenção** - Tarefas de manutenção de imóveis
* **Proprietários** - Gestão de proprietários

### Ferramentas
Funcionalidades auxiliares:

* **Maria IA** - Assistente virtual inteligente
* **Documentos** - Upload e processamento de documentos
* **Análises** - Relatórios estatísticos e análises

### Configurações
Ajustes do sistema:

* **Configurações** - Preferências do sistema
* **Dados Demo** - Ferramentas para demonstração

## Navegação Mobile

A barra inferior de navegação mobile conterá apenas 5 itens essenciais:
1. **Home** - Dashboard principal
2. **Imóveis** - Propriedades
3. **Reservas** - Calendário e reservas
4. **Finanças** - Relatórios financeiros
5. **Operações** - Acesso a limpeza e manutenção

## Comparação com Navegação Atual

### Antes (Categorias Principais)
- Menu Principal (Dashboard, Propriedades, Reservas, Proprietários)
- Ferramentas (Upload de PDF, Assistente IA)
- Manutenção (Tarefas Pendentes, Solicitar Manutenção)
- Pagamentos (Pagamentos de Saída, Pagamentos de Entrada)
- Gestão (Equipas de Limpeza, Relatórios, Configurações)
- Utilitários (Dados Demo)

### Depois (Nova Estrutura)
- **Core** (Home, Imóveis, Reservas)
- **Finanças** (Financeiro, Faturas, Entradas, Saídas)
- **Operações** (Limpeza, Manutenção, Proprietários)
- **Ferramentas** (Maria IA, Documentos, Análises)
- **Configurações** (Configurações, Dados Demo)

## Principais Melhorias

1. **Redução de Níveis Hierárquicos**: De 6 categorias para 5, mais bem organizadas
2. **Terminologia Simplificada**: Nomes mais curtos e intuitivos (ex: "Imóveis" em vez de "Propriedades")
3. **Agrupamento Contextual**: Funcionalidades relacionadas agrupadas logicamente
4. **Priorização Mobile**: Barra de navegação inferior com os 5 itens mais importantes
5. **Destaque Visual**: Codificação por cores e ícones mais intuitivos
6. **Experiência Consistente**: Mesmos princípios aplicados em desktop e mobile

## Implementação Técnica

A implementação desta nova estrutura requer:

1. Atualização do componente `sidebar.tsx` para o novo modelo `sidebar-reorganized.tsx`
2. Substituição do componente `mobile-nav.tsx` pelo `mobile-nav-reorganized.tsx`
3. Atualização das traduções para refletir os novos termos mais curtos
4. Ajustes visuais para codificação por cores dos grupos funcionais
5. Manutenção das rotas existentes sem alterações nas páginas atuais

Esta reorganização mantém todas as funcionalidades existentes, apenas reorganizando-as de maneira mais intuitiva e eficiente para os usuários.