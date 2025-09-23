# 📋 Relatório de Análise das Regras de Negócio - MariaIntelligence

## 🎯 Resumo Executivo

Este relatório documenta a análise completa das regras de negócio, configurações de propriedades e sistemas de cálculo de preços da aplicação MariaIntelligence.

## 🏠 Estrutura de Propriedades

### Tipos de Propriedades Suportados

**Apartamentos (T0-T5):**
- **T0/T1**: €47 (base)
- **T2**: €60 (base)
- **T3**: €70 (base)
- **T4**: €80 (base)
- **T5**: €90 (base)

**Moradias (V1-V5):**
- **V1**: €75 (base)
- **V2**: €95 (base)
- **V3**: €115 (base)
- **V4**: €135 (base)
- **V5**: €150 (base)

### Características Extras (+€10 cada)

- **Duplex**: +€10
- **BBQ**: +€10
- **Área Exterior**: +€10
- **Jardim de Inverno**: +€10

*Localização: `client/src/api/constants.ts` e `server/api/constants.ts`*

## 💰 Sistema de Preços e Comissões

### Estrutura de Custos por Propriedade

Cada propriedade possui os seguintes campos financeiros:

```typescript
// Campos definidos em shared/schema.ts
{
  cleaningCost: real,      // Custo de limpeza
  checkInFee: real,        // Taxa de check-in
  commission: real,        // Comissão da plataforma
  teamPayment: real,       // Pagamento à equipe
  monthlyFixedCost: real   // Custo fixo mensal
}
```

### Sistema de Reservas e Cálculos

**Campos de Cálculo Automático:**
- `totalAmount`: Valor total da reserva
- `checkInFee`: Taxa de check-in aplicada
- `teamPayment`: Pagamento calculado para equipe
- `platformFee`: Taxa da plataforma
- `cleaningFee`: Taxa de limpeza
- `commission`: Comissão calculada
- `netAmount`: Valor líquido após deduções

*Localização: `shared/schema.ts` - Tabela `reservations`*

## 📊 Calculadora de Orçamentos

### Lógica de Cálculo Principal

**Fórmula Base:**
```javascript
// Localização: server/controllers/budget.controller.ts
const margin = total * 0.1; // 10% de margem padrão
```

**Processo de Cálculo:**
1. **Entrada**: Número de noites e taxa por noite
2. **Validação**: Verificação de valores mínimos
3. **Cálculo**: Total = noites × taxa por noite
4. **Margem**: Aplicação de 10% de margem
5. **Resultado**: Retorno do orçamento estimado

### Interface de Orçamento

```typescript
// Localização: client/src/lib/budget.ts
interface BudgetEstimate {
  success: boolean;
  nights: number;
  nightlyRate: number;
  total: number;
  margin: number;
}
```

## 🏢 Sistema de Cotações

### Estrutura Completa de Cotações

**Campos Principais:**
- Informações da propriedade
- Detalhes do cliente
- Cálculos de preços
- Serviços adicionais
- Observações especiais

**Tipos de Serviços Extras:**
- Limpeza adicional
- Serviços de manutenção
- Equipamentos especiais
- Gestão personalizada

*Localização: `shared/schema.ts` - Tabela `quotations`*

## 📋 Validações e Constantes

### Regras de Validação

**Propriedades:**
- Nome obrigatório (min: 1 caractere)
- Endereço obrigatório
- Tipo de propriedade deve estar na lista predefinida
- Valores financeiros devem ser positivos

**Reservas:**
- Data de check-in obrigatória
- Data de check-out posterior ao check-in
- Cliente deve existir no sistema
- Propriedade deve estar disponível

**Orçamentos:**
- Número de noites mínimo: 1
- Taxa por noite mínima: €1
- Margem padrão: 10%

### Constantes do Sistema

**Taxas Fixas:**
- Margem padrão: 10%
- Taxa mínima por noite: €1
- Incremento de características: €10

**Configurações:**
- Moeda padrão: EUR (€)
- Precisão decimal: 2 casas
- Formato de data: ISO 8601

## 🔧 Arquivos Críticos Identificados

### 1. Schema Principal
**Arquivo**: `shared/schema.ts`
- **Função**: Define toda a estrutura de dados
- **Conteúdo**: Tabelas, campos, tipos, validações
- **Importância**: ⭐⭐⭐⭐⭐ (Crítico)

### 2. Constantes de Preços
**Arquivo**: `client/src/api/constants.ts` + `server/api/constants.ts`
- **Função**: Define preços base e extras
- **Conteúdo**: Tabelas de preços por tipo
- **Importância**: ⭐⭐⭐⭐⭐ (Crítico)

### 3. Controlador de Orçamentos
**Arquivo**: `server/controllers/budget.controller.ts`
- **Função**: Lógica de cálculo de orçamentos
- **Conteúdo**: Fórmulas, validações, API
- **Importância**: ⭐⭐⭐⭐ (Alto)

### 4. Biblioteca de Orçamentos
**Arquivo**: `client/src/lib/budget.ts`
- **Função**: Interface e tipos do cliente
- **Conteúdo**: Definições TypeScript
- **Importância**: ⭐⭐⭐ (Médio)

### 5. Componente Calculadora
**Arquivo**: `client/src/components/budget/budget-calculator.tsx`
- **Função**: Interface do usuário
- **Conteúdo**: Formulários, displays
- **Importância**: ⭐⭐⭐ (Médio)

## 📈 Fluxo de Negócio

### 1. Cadastro de Propriedade
```
Entrada → Validação → Aplicação de Preços Base → Cálculo Extras → Persistência
```

### 2. Criação de Orçamento
```
Parâmetros → Validação → Cálculo Base → Aplicação Margem → Retorno
```

### 3. Processamento de Reserva
```
Dados → Validação → Cálculo Custos → Distribuição Pagamentos → Confirmação
```

## 🔍 Conclusões e Recomendações

### ✅ Pontos Fortes
- Sistema bem estruturado com separação clara de responsabilidades
- Validações adequadas implementadas
- Cálculos consistentes entre cliente e servidor
- Documentação através de tipos TypeScript

### ⚠️ Áreas de Atenção
- Preços hardcoded em constantes (considerar base de dados)
- Margem fixa de 10% (considerar configuração dinâmica)
- Duplicação de constantes entre cliente e servidor

### 🚀 Sugestões de Melhoria
1. **Centralizar preços** numa tabela de configuração
2. **Implementar margem configurável** por propriedade/período
3. **Adicionar histórico** de alterações de preços
4. **Criar sistema de descontos** e promoções
5. **Implementar cálculo de impostos** automático

---

**Data de Análise**: 23 de Setembro 2025
**Versão da Aplicação**: 1.0.0
**Analista**: Claude Code Assistant
**Status**: ✅ Completa