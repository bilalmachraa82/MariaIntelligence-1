# 🎯 MARIA FAZ - CONTROL & ROADMAP
**Sistema de Gestão de Propriedades com IA**  
*Documento de Controlo e Planeamento Estratégico*

---

## 📊 STATUS GERAL DO PROJETO

### ✅ CONCLUÍDO (SISTEMA ATUAL)
- **Infraestrutura Base:** PostgreSQL + Drizzle ORM + Express
- **Frontend:** React + TypeScript + shadcn/ui + Tailwind
- **IA Gemini:** API configurada e funcional (18 modelos disponíveis)
- **Schemas:** 31 tabelas completas na base de dados
- **Dados Reais:** 32 proprietários + 31 propriedades + equipas limpeza
- **OCR Básico:** Processamento de PDFs individuais
- **i18n:** Português/Inglês com traduções completas
- **Dashboard:** Métricas financeiras e ocupação
- **CRUD:** Propriedades, proprietários, reservas, limpeza
- **Relatórios:** PDFs financeiros por proprietário
- **Automações:** Status de reservas + agendamento limpeza

### 🔧 PROBLEMAS IDENTIFICADOS (A CORRIGIR)
- **OCR Complexo:** 4 providers diferentes (complexidade desnecessária)
- **Múltiplas Reservas:** Dificuldade em extrair 7-11 reservas de arquivos de controle
- **Sem Autenticação:** Todos acedem a todos os dados
- **Base de Dados:** PostgreSQL no Replit (limitações de escalabilidade)
- **Configuração:** Muitas APIs externas (OpenRouter, HuggingFace, etc.)

---

## 🚀 ROADMAP ESTRATÉGICO

### ESTRATÉGIA RECOMENDADA: MIGRAÇÃO PARA LOVABLE + SUPABASE

#### **OPÇÃO A: IMPLEMENTAÇÃO NOVA NO LOVABLE (RECOMENDADO)**
```
✅ Usar PROJECT_REQUIREMENTS.txt como blueprint completo
✅ Tecnologias: Next.js 14 + Supabase + Gemini 2.5 Flash
✅ Benefícios: Arquitetura moderna, escalável, segura
✅ Tempo: 6-8 semanas (seguindo roadmap de 4 fases)
```

#### **OPÇÃO B: EVOLUÇÃO DO SISTEMA ATUAL**
```
⚠️ Implementar melhorias incrementais no Replit
⚠️ Adicionar autenticação + simplificar OCR
⚠️ Benefícios: Aproveitamento do código existente
⚠️ Limitações: Arquitetura legacy, menos escalável
```

---

## 📋 FASE 1: FOUNDATION (Semanas 1-2)

### 🎯 META: Configurar Base Sólida

#### ✅ TAREFAS CONCLUÍDAS (Preparação)
- [x] Documento completo PROJECT_REQUIREMENTS.txt
- [x] Análise crítica de arquitetura OCR
- [x] Definição de tipos de utilizadores
- [x] Templates CSV para importação
- [x] Schema completo com 31 tabelas

#### 🚧 TAREFAS PENDENTES (Lovable)
- [ ] **Setup Supabase**
  - [ ] Criar projeto Supabase
  - [ ] Configurar autenticação (email + Google)
  - [ ] Implementar Row Level Security (RLS)
  - [ ] Migrar schemas PostgreSQL

- [ ] **Sistema de Autenticação (SIMPLIFICADO)**
  - [ ] Login básico com email/password (só para admin)
  - [ ] Página de login simples
  - [ ] Sessão segura
  - [ ] Proteção de todas as rotas (só admin acede)

- [ ] **Importação CSV**
  - [ ] Interface de upload
  - [ ] Processamento owners.csv (32 proprietários)
  - [ ] Processamento properties.csv (31 propriedades)
  - [ ] Processamento cleaning_teams.csv
  - [ ] Validação e error handling

- [ ] **Design System**
  - [ ] Configurar shadcn/ui + Tailwind
  - [ ] Tema Maria Faz (cores, tipografia)
  - [ ] Componentes base (Header, Sidebar, Cards)
  - [ ] Layout responsivo mobile-first

---

## 📋 FASE 2: CORE FEATURES (Semanas 3-4)

### 🎯 META: Funcionalidades Essenciais

#### 🚧 TAREFAS PENDENTES
- [ ] **CRUD Proprietários**
  - [ ] Listagem com filtros
  - [ ] Formulário criação/edição
  - [ ] Validação Zod + react-hook-form
  - [ ] RLS (ver apenas próprios dados)

- [ ] **CRUD Propriedades**
  - [ ] Dashboard de propriedades
  - [ ] Gestão de aliases (matching OCR)
  - [ ] Configuração custos (limpeza, comissão, etc.)
  - [ ] Upload de imagens

- [ ] **CRUD Reservas**
  - [ ] Calendário de reservas
  - [ ] Estados (confirmed, checked-in, completed)
  - [ ] Cálculos financeiros automáticos
  - [ ] Filtros por propriedade/período

- [ ] **OCR Simplificado**
  - [ ] Implementar: PDF → pdf-parse → Gemini → JSON
  - [ ] Interface de upload de PDFs
  - [ ] Preview + correção manual
  - [ ] Processamento batch (múltiplos PDFs)

- [ ] **Dashboard Principal**
  - [ ] Métricas financeiras em tempo real
  - [ ] Gráficos (revenue, ocupação, trend)
  - [ ] Filtros por utilizador (RLS)
  - [ ] Calendário check-ins/check-outs

---

## 📋 FASE 3: OPERATIONS (Semanas 5-6)

### 🎯 META: Gestão Operacional

#### 🚧 TAREFAS PENDENTES
- [ ] **Gestão de Limpeza**
  - [ ] Agendamento automático pós-checkout
  - [ ] Atribuição a equipas
  - [ ] App mobile para equipas (photos, status)
  - [ ] Cálculo automático de pagamentos

- [ ] **Sistema de Manutenção**
  - [ ] Criação de tarefas
  - [ ] Atribuição a técnicos
  - [ ] Gestão de materiais/custos
  - [ ] Histórico de manutenções

- [ ] **Relatórios Financeiros**
  - [ ] Relatório por proprietário (PDF)
  - [ ] Breakdown de custos detalhado
  - [ ] Comparações mês/ano anterior
  - [ ] Export para Excel/CSV

- [ ] **Automações**
  - [ ] Status automático de reservas
  - [ ] Emails de confirmação
  - [ ] Lembretes de check-in/out
  - [ ] Faturas mensais automáticas

---

## 📋 FASE 4: AI & AUTOMATION (Semanas 7-8)

### 🎯 META: IA Avançada e Automação Total

#### 🚧 TAREFAS PENDENTES
- [ ] **Assistente IA Maria**
  - [ ] Chat conversacional com Gemini
  - [ ] Integração com base de dados (RAG)
  - [ ] Comandos em linguagem natural
  - [ ] Suporte PT/EN com context switching

- [ ] **OCR Avançado**
  - [ ] Processamento de arquivos controle (7-11 reservas)
  - [ ] Detecção automática tipo documento
  - [ ] Correção inteligente de dados
  - [ ] Matching fuzzy de propriedades

- [ ] **Notificações Inteligentes**
  - [ ] Email automático (SendGrid)
  - [ ] SMS (opcional - Twilio)
  - [ ] Push notifications (PWA)
  - [ ] Alertas personalizados

- [ ] **Analytics Avançados**
  - [ ] Previsão de ocupação (IA)
  - [ ] Otimização de preços
  - [ ] Relatórios de tendências
  - [ ] KPIs personalizados

---

## 🔧 MELHORIAS DO SISTEMA ATUAL (Se Opção B)

### PRIORIDADE ALTA (Críticas)
- [ ] **Simplificar OCR**
  ```typescript
  // Substituir 4 providers por 1
  PDF → pdf-parse → Gemini 2.5 Flash → JSON
  ```

- [ ] **Implementar Autenticação**
  - [ ] Sistema de sessões seguro
  - [ ] Middleware de proteção
  - [ ] Tipos de utilizador

- [ ] **Corrigir Múltiplas Reservas**
  - [ ] Melhorar prompt Gemini
  - [ ] Validação de extração completa
  - [ ] Retry automático se < 7 reservas

### PRIORIDADE MÉDIA
- [ ] **Melhorar Error Handling**
  - [ ] Logs estruturados
  - [ ] Recovery automático
  - [ ] User-friendly messages

- [ ] **Otimizar Performance**
  - [ ] Cache de queries frequentes
  - [ ] Lazy loading de imagens
  - [ ] Compression de PDFs

### PRIORIDADE BAIXA
- [ ] **Features Novas**
  - [ ] PWA (instalação mobile)
  - [ ] Dark mode
  - [ ] Integração calendários externos

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Técnicos
- **Tempo de Processamento OCR:** < 30 segundos por PDF
- **Precisão de Extração:** > 95% para dados estruturados
- **Uptime:** > 99.5%
- **Tempo de Resposta:** < 2 segundos (queries normais)

### KPIs de Negócio
- **Adoção:** 100% dos proprietários ativos
- **Satisfação:** > 4.5/5 stars
- **Eficiência:** 80% redução tempo gestão manual
- **ROI:** Break-even em 6 meses

---

## 🎯 RECOMENDAÇÃO FINAL

### ✅ ESTRATÉGIA IDEAL: LOVABLE + SUPABASE

**Justificação:**
1. **Código Limpo:** Arquitetura moderna desde o início
2. **Escalabilidade:** Supabase suporta crescimento exponencial  
3. **Segurança:** RLS nativo, autenticação robusta
4. **Manutenibilidade:** TypeScript + Next.js + padrões atuais
5. **Produtividade:** 70% menos código com APIs geradas
6. **Futuro-proof:** Stack atual e bem suportado

**Timeline:** 6-8 semanas para sistema completo funcional

**Próximos Passos:**
1. ✅ PROJECT_REQUIREMENTS.txt → Upload para Lovable
2. 🚀 Criar projeto Supabase
3. 📋 Seguir roadmap Fase 1
4. 🔄 Iterações semanais com feedback

---

*Documento atualizado: 26/05/2025*  
*Próxima revisão: Início de cada fase*