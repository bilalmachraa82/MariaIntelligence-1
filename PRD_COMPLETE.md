# PRD Completo - Sistema Maria Faz Property Management

## 1. VISÃO GERAL DO PRODUTO

### Objetivo Principal
Sistema integrado de gestão de propriedades com processamento inteligente de documentos PDF e base de dados acessível por IA para automatização completa do workflow.

### Proposta de Valor
- **Automação Total**: Processamento automático de PDFs de reservas, check-ins e check-outs
- **IA Integrada**: Base de dados acessível por IA para consultas naturais e relatórios automáticos
- **Multi-formato**: Suporte completo para diferentes tipos de PDF (digitais, escaneados, manuscritos)
- **Escalabilidade**: Arquitetura preparada para crescimento e integração com plataformas externas

## 2. PERSONAS E STAKEHOLDERS

### Persona Principal: Gestora de Propriedades (Carina)
- **Background**: Gere 20+ propriedades de alojamento local
- **Pain Points**: Processamento manual de documentos, relatórios demorados, falta de visibilidade
- **Needs**: Automação, relatórios instantâneos, interface simples

### Persona Secundária: Proprietário de Imóveis
- **Background**: Possui 1-5 propriedades, delega gestão
- **Pain Points**: Falta transparência, relatórios incompletos
- **Needs**: Relatórios mensais automáticos, visibilidade financeira

## 3. USER STORIES DETALHADAS

### Epic 1: Autenticação e Segurança
```
US001: Login Seguro
Como gestora de propriedades
Quero fazer login seguro no sistema
Para proteger dados confidenciais dos clientes

Critérios de Aceitação:
- [ ] Login com email/password
- [ ] Sessão segura por 8 horas
- [ ] Logout automático por inatividade
- [ ] Proteção contra ataques brute force
- [ ] Logs de acesso registados

Testes:
- Teste login válido/inválido
- Teste timeout sessão
- Teste tentativas múltiplas login
```

### Epic 2: Processamento de Documentos PDF

```
US002: Upload de PDF Único
Como gestora de propriedades
Quero fazer upload de um PDF de reserva
Para extrair automaticamente os dados da reserva

Critérios de Aceitação:
- [ ] Suporte PDF até 10MB
- [ ] Detecção automática tipo documento (reserva/check-in/check-out)
- [ ] Preview do documento antes processamento
- [ ] Indicador de progresso durante processamento
- [ ] Validação de dados extraídos

Formatos Suportados:
- PDF digital (texto selecionável)
- PDF escaneado (OCR necessário)
- PDF com manuscritos
- PDF multilíngue (PT, EN, ES, FR)

Testes:
- Teste com PDF Booking.com
- Teste com PDF Airbnb
- Teste com PDF manuscrito
- Teste com PDF corrompido
- Teste com arquivo não-PDF
```

```
US003: Upload de Múltiplos PDFs
Como gestora de propriedades
Quero processar múltiplos PDFs simultaneamente
Para economizar tempo com lotes de documentos

Critérios de Aceitação:
- [ ] Upload de até 20 PDFs simultaneamente
- [ ] Processamento paralelo com fila
- [ ] Relatório de sucesso/erro por arquivo
- [ ] Possibilidade de cancelar processamento
- [ ] Notificação quando concluído

Testes:
- Teste com 5 PDFs válidos
- Teste com mix válidos/inválidos
- Teste cancelamento durante processamento
```

```
US004: Extração Inteligente de Dados
Como gestora de propriedades
Quero que o sistema extraia automaticamente dados relevantes
Para não ter que digitar manualmente

Dados a Extrair:
- Nome do hóspede
- Datas check-in/check-out
- Número de hóspedes (adultos/crianças)
- Valor total e detalhamento
- Propriedade/local
- Número de referência
- Contactos (email/telefone)
- País de origem

Critérios de Aceitação:
- [ ] Precisão mínima 95% para PDFs digitais
- [ ] Precisão mínima 85% para PDFs escaneados
- [ ] Validação automática de datas
- [ ] Conversão automática de moedas
- [ ] Detecção de propriedade por nome/morada

Testes:
- Teste com 50 PDFs reais diferentes
- Teste validação de dados extraídos
- Teste detecção propriedade
```

### Epic 3: Gestão de Propriedades

```
US005: Cadastro de Propriedades
Como gestora de propriedades
Quero cadastrar novas propriedades no sistema
Para organizar meu portfólio

Critérios de Aceitação:
- [ ] Formulário com campos obrigatórios/opcionais
- [ ] Upload de fotos da propriedade
- [ ] Definição de aliases/apelidos
- [ ] Configuração de custos e comissões
- [ ] Atribuição de equipa de limpeza
- [ ] Validação de dados únicos

Campos Obrigatórios:
- Nome da propriedade
- Proprietário
- Morada completa
- Custos operacionais

Testes:
- Teste criação propriedade válida
- Teste validação campos obrigatórios
- Teste duplicação de nomes
```

```
US006: Gestão de Proprietários
Como gestora de propriedades
Quero gerir informações dos proprietários
Para manter contactos e dados fiscais atualizados

Critérios de Aceitação:
- [ ] CRUD completo de proprietários
- [ ] Validação de NIF português
- [ ] Múltiplas propriedades por proprietário
- [ ] Histórico de alterações
- [ ] Export para Excel/PDF

Testes:
- Teste validação NIF
- Teste associação múltiplas propriedades
- Teste export dados
```

### Epic 4: Gestão de Reservas

```
US007: Visualização de Reservas
Como gestora de propriedades
Quero ver todas as reservas numa lista
Para ter visão geral da ocupação

Critérios de Aceitação:
- [ ] Lista paginada com filtros
- [ ] Filtros por data, propriedade, status
- [ ] Ordenação por diferentes campos
- [ ] Preview rápido de detalhes
- [ ] Indicadores visuais de status

Status Possíveis:
- Pendente (recém criada)
- Confirmada (pagamento confirmado)
- Check-in realizado
- Check-out realizado
- Cancelada
- No-show

Testes:
- Teste filtros e ordenação
- Teste paginação
- Teste performance com 1000+ reservas
```

```
US008: Atualização Automática de Status
Como gestora de propriedades
Quero que o status das reservas seja atualizado automaticamente
Para não ter trabalho manual diário

Critérios de Aceitação:
- [ ] Confirmada → Check-in (quando data chegou)
- [ ] Check-in → Check-out (quando data passou)
- [ ] Execução automática a cada 5 minutos
- [ ] Log de alterações automáticas
- [ ] Possibilidade override manual

Testes:
- Teste scheduler automático
- Teste mudanças de status
- Teste override manual
```

### Epic 5: Limpezas e Manutenção

```
US009: Agendamento Automático de Limpezas
Como gestora de propriedades
Quero que limpezas sejam agendadas automaticamente
Para garantir que propriedades estão sempre prontas

Critérios de Aceitação:
- [ ] Limpeza pré check-in (dia anterior)
- [ ] Limpeza pós check-out (mesmo dia)
- [ ] Atribuição automática de equipa
- [ ] Notificação para equipas
- [ ] Gestão de disponibilidade

Testes:
- Teste agendamento automático
- Teste notificações
- Teste conflitos de agenda
```

```
US010: Gestão de Tarefas de Manutenção
Como gestora de propriedades
Quero registar e acompanhar tarefas de manutenção
Para manter propriedades em bom estado

Critérios de Aceitação:
- [ ] Registo de problemas reportados
- [ ] Atribuição a fornecedores
- [ ] Acompanhamento de custos
- [ ] Fotos antes/depois
- [ ] Integração com faturação

Testes:
- Teste workflow completo manutenção
- Teste upload fotos
- Teste cálculo custos
```

### Epic 6: Relatórios e Análises

```
US011: Relatórios Financeiros Automáticos
Como proprietário de imóveis
Quero receber relatórios mensais automáticos
Para acompanhar performance das minhas propriedades

Critérios de Aceitação:
- [ ] Geração automática no fim do mês
- [ ] Envio por email em PDF
- [ ] Detalhamento receitas/despesas
- [ ] Gráficos de performance
- [ ] Comparação com mês anterior

Métricas Incluídas:
- Receita bruta/líquida
- Taxa de ocupação
- Custos operacionais
- Lucro por propriedade
- Previsões próximo mês

Testes:
- Teste geração relatório
- Teste envio email
- Teste cálculos financeiros
```

```
US012: Dashboard Executivo
Como gestora de propriedades
Quero ver métricas principais numa dashboard
Para tomar decisões rápidas

Critérios de Aceitação:
- [ ] KPIs principais em tempo real
- [ ] Gráficos interativos
- [ ] Filtros por período/propriedade
- [ ] Export para apresentações
- [ ] Atualizações automáticas

KPIs Principais:
- Ocupação hoje/semana/mês
- Receita acumulada
- Check-ins/outs pendentes
- Tarefas manutenção abertas
- Performance por propriedade

Testes:
- Teste precisão KPIs
- Teste performance dashboard
- Teste responsividade
```

### Epic 7: IA e Automação

```
US013: Assistente IA para Consultas
Como gestora de propriedades
Quero fazer perguntas em linguagem natural
Para obter informações rapidamente

Critérios de Aceitação:
- [ ] Interface chat integrada
- [ ] Perguntas em português
- [ ] Acesso a toda base de dados
- [ ] Respostas com fontes/dados
- [ ] Sugestões de perguntas

Exemplos de Perguntas:
- "Qual foi a receita de Dezembro?"
- "Que propriedades têm check-in amanhã?"
- "Quanto gastei em manutenção este mês?"
- "Qual a taxa ocupação da Casa Azul?"

Testes:
- Teste 100 perguntas reais
- Teste precisão respostas
- Teste tempo resposta
```

```
US014: Insights e Recomendações
Como gestora de propriedades
Quero receber insights automáticos
Para otimizar operations

Critérios de Aceitação:
- [ ] Análise padrões ocupação
- [ ] Alertas anomalias
- [ ] Sugestões otimização preços
- [ ] Previsões demanda
- [ ] Relatórios tendências

Testes:
- Teste detecção anomalias
- Teste precisão previsões
- Teste qualidade sugestões
```

## 4. ARQUITETURA TÉCNICA

### Stack Technology
```
Frontend:
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query para state management
- React Hook Form + Zod validação

Backend:
- Node.js + Express + TypeScript
- PostgreSQL + Drizzle ORM
- Múltiplas APIs IA (Gemini, OpenRouter, RolmOCR)
- Express Session + PostgreSQL store

IA & OCR:
- Gemini 2.5 Flash (principal)
- OpenRouter/Mistral (OCR documentos)
- RolmOCR (manuscritos)
- Sistema fallback automático

Infrastructure:
- Docker containers
- PostgreSQL com pgVector
- Redis para cache
- CDN para assets estáticos
```

### Base de Dados Acessível por IA

```sql
-- Schema otimizado para queries IA
CREATE TABLE ai_queryable_view AS
SELECT 
  r.id as reservation_id,
  r.guest_name,
  r.check_in_date,
  r.check_out_date,
  r.total_amount,
  r.status,
  p.name as property_name,
  o.name as owner_name,
  c.scheduled_date as cleaning_date,
  mt.description as maintenance_description
FROM reservations r
JOIN properties p ON r.property_id = p.id
JOIN owners o ON p.owner_id = o.id
LEFT JOIN cleanings c ON r.id = c.reservation_id
LEFT JOIN maintenance_tasks mt ON p.id = mt.property_id;

-- Índices para performance IA
CREATE INDEX idx_ai_dates ON ai_queryable_view(check_in_date, check_out_date);
CREATE INDEX idx_ai_amounts ON ai_queryable_view(total_amount);
CREATE INDEX idx_ai_text ON ai_queryable_view USING gin(to_tsvector('portuguese', guest_name || ' ' || property_name));
```

### Formatos PDF Suportados

```typescript
interface PDFFormat {
  type: 'booking' | 'airbnb' | 'direct' | 'expedia' | 'vrbo';
  structure: 'digital' | 'scanned' | 'mixed' | 'handwritten';
  language: 'pt' | 'en' | 'es' | 'fr' | 'de';
  confidence: number; // 0-100%
}

// Pipeline processamento
const PDFProcessor = {
  detect: (buffer: Buffer) => PDFFormat,
  extract: (buffer: Buffer, format: PDFFormat) => ReservationData,
  validate: (data: ReservationData) => ValidationResult,
  save: (data: ReservationData) => Promise<Reservation>
};
```

## 5. ESTRATÉGIA DE TESTES

### Testes Unitários (Jest + Testing Library)
```
Cobertura Mínima: 90%

Backend:
- [ ] Todos os endpoints API
- [ ] Serviços de processamento PDF
- [ ] Validações Zod
- [ ] Funções de cálculo financeiro
- [ ] Scheduler automático

Frontend:
- [ ] Componentes principais
- [ ] Formulários e validações
- [ ] Hooks customizados
- [ ] Utilities e helpers
```

### Testes Integração
```
Base de Dados:
- [ ] CRUD operations todas entidades
- [ ] Transações complexas
- [ ] Performance queries
- [ ] Migrations

APIs Externas:
- [ ] Gemini API diferentes tipos documento
- [ ] OpenRouter fallback scenarios
- [ ] Email service reliability
- [ ] Error handling all services
```

### Testes End-to-End (Playwright)
```
Workflows Críticos:
- [ ] Login → Upload PDF → Verificar dados extraídos
- [ ] Criar propriedade → Associar reserva → Gerar relatório
- [ ] Agendar limpeza → Marcar concluída → Verificar faturação
- [ ] Chat IA → Fazer pergunta → Validar resposta

Cenários Edge:
- [ ] PDF corrompido
- [ ] Internet instável
- [ ] Base dados indisponível
- [ ] APIs IA em baixo
```

### Dataset de Testes
```
PDFs Reais (100+ exemplos):
- Booking.com (20 variações)
- Airbnb (20 variações)
- Expedia (15 variações)
- Reservas diretas (15 variações)
- PDFs manuscritos (10 variações)
- PDFs multilíngue (20 variações)

Dados Sintéticos:
- 1000 reservas históricas
- 50 propriedades diferentes
- 20 proprietários
- 200 tarefas manutenção
- 500 limpezas agendadas
```

## 6. DEFINIÇÃO DE PRONTO (DoD)

### Feature Completa Quando:
- [ ] Código implementado e revisado
- [ ] Testes unitários passando (90%+ cobertura)
- [ ] Testes integração passando
- [ ] Documentação atualizada
- [ ] Deploy em staging testado
- [ ] Performance validada
- [ ] Segurança verificada
- [ ] UX review aprovado

### Release Pronto Quando:
- [ ] Todas features testadas
- [ ] Performance benchmark atingido
- [ ] Segurança audit completo
- [ ] Backup/restore testado
- [ ] Monitoring configurado
- [ ] Documentação usuário final
- [ ] Training Carina completado

## 7. MÉTRICAS DE SUCESSO

### KPIs Produto
- **Precisão OCR**: >95% documentos digitais, >85% escaneados
- **Tempo Processamento**: <30s por PDF
- **Uptime Sistema**: >99.5%
- **Tempo Resposta IA**: <5s para consultas
- **Satisfação Usuário**: >4.5/5

### KPIs Negócio
- **Redução Tempo Manual**: 80% menos tempo entrada dados
- **Aumento Produtividade**: Gerir 50% mais propriedades
- **Precisão Relatórios**: 100% dados financeiros corretos
- **ROI**: Payback 6 meses

## 8. ROADMAP DE IMPLEMENTAÇÃO

### Fase 1 (4 semanas): Base Foundation
- Autenticação e segurança
- CRUD básico propriedades/reservas
- Upload e processamento PDF simples
- Dashboard básico

### Fase 2 (4 semanas): IA Integration
- Multi-format PDF processing
- IA assistant básico
- Relatórios automáticos
- Scheduler tarefas

### Fase 3 (4 semanas): Advanced Features
- Múltiplos PDFs simultâneos
- Advanced analytics
- Mobile responsivo
- Performance optimization

### Fase 4 (2 semanas): Production Ready
- Security hardening
- Monitoring completo
- Backup strategies
- User training

## 9. RISCOS E MITIGAÇÕES

### Riscos Técnicos
- **APIs IA indisponíveis**: Sistema fallback robusto
- **Performance PDF grandes**: Processamento assíncrono
- **Precisão OCR baixa**: Múltiplos providers + validação manual

### Riscos Negócio
- **Dados incorretos**: Validação multi-camada + audit trail
- **Adoção usuário**: UX research contínuo + training
- **Escalabilidade**: Arquitetura cloud-native desde início

Esta especificação garante uma implementação robusta, testada e escalável, preparada para recriação em qualquer plataforma com base sólida em user stories, testes abrangentes e arquitetura bem definida.