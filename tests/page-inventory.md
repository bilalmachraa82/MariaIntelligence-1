# MariaIntelligence Page Inventory & Test Plan

## Page Route Mapping

Based on the App.tsx routing configuration, the application has 47 distinct routes organized into 12 main sections:

### 1. Dashboard & Home (3 routes)
- **/** - Main Dashboard (DashboardFull)
- **/painel** - Dashboard alias
- **/painel-completo** - Dashboard complete alias

### 2. Properties Management (4 routes)
- **/propriedades** - Properties list page
- **/propriedades/editar/:id?** - Property edit/create page
- **/propriedades/estatisticas** - Property statistics page
- **/propriedades/:id** - Property details page

### 3. Owners Management (3 routes)
- **/proprietarios** - Owners list page
- **/proprietarios/editar/:id?** - Owner edit/create page
- **/proprietarios/:id** - Owner details page

### 4. Reservations Management (4 routes)
- **/reservas** - Reservations list page
- **/reservas/nova** - New reservation page
- **/reservas/:id** - Reservation details page
- **/reservas/aprovacao** - Reservation approval page

### 5. Budget Calculator (1 route)
- **/calculadora-orcamento** - Budget calculator page

### 6. Document Processing (3 routes)
- **/upload-pdf** - PDF upload page
- **/enviar-pdf** - PDF upload alias
- **/digitalizar** - PDF digitize alias

### 7. Cleaning Teams (5 routes)
- **/equipas-limpeza** - Cleaning teams list
- **/equipas-limpeza/nova** - New cleaning team (placeholder)
- **/equipas-limpeza/agendamentos** - Cleaning schedules
- **/equipas-limpeza/:id** - Cleaning team details (placeholder)
- **/relatorios-limpeza** - Cleaning reports

### 8. Reports (4 routes)
- **/relatorios** - Reports main page
- **/relatorios/proprietario** - Owner reports
- **/relatorios/faturacao-mensal** - Monthly invoice reports
- **/relatorios/tendencias** - Trends reports

### 9. Settings & Assistant (4 routes)
- **/configuracoes** - Settings page
- **/assistente** - AI Assistant page
- **/assistente-reservas** - Reservation assistant page
- **/dados-demo** - Demo data management
- **/dados-demo/remocao-forcada** - Force demo data reset

### 10. Maintenance (3 routes)
- **/manutencao/pendentes** - Pending maintenance
- **/manutencao/solicitacao** - Maintenance requests
- **/manutencao/nova** - New maintenance task

### 11. Payments (4 routes)
- **/pagamentos** - Incoming payments (default)
- **/pagamentos/saida** - Outgoing payments
- **/pagamentos/entrada** - Incoming payments
- **/pagamentos/novo** - New payment

### 12. Financial Documents (8 routes)
- **/financeiro/documentos** - Financial documents list
- **/financeiro/documentos/novo** - New document
- **/financeiro/documentos/editar/:id** - Edit document
- **/financeiro/documentos/itens/novo** - New document item
- **/financeiro/documentos/itens/editar/:id** - Edit document item
- **/financeiro/documentos/pagamentos/novo** - New payment
- **/financeiro/documentos/pagamentos/editar/:id** - Edit payment
- **/financeiro/documentos/:id** - Document details
- **/documentos** - Documents alias

### 13. Quotations (4 routes)
- **/orcamentos** - Quotations list
- **/orcamentos/novo** - New quotation
- **/orcamentos/:id/editar** - Edit quotation
- **/orcamentos/:id** - Quotation details

### 14. Error Handling (1 route)
- **Wildcard** - 404 Not Found page

## Critical Test Categories

### A. High Priority Pages (Core Business Logic)
1. Dashboard (/) - Central hub with daily tasks
2. Properties (/propriedades) - Core asset management
3. Reservations (/reservas) - Revenue generation
4. Financial Documents (/financeiro/documentos) - Financial management

### B. Medium Priority Pages (Supporting Features)
1. Owners (/proprietarios) - Customer management
2. Reports (/relatorios) - Business intelligence
3. Payments (/pagamentos) - Financial tracking
4. Quotations (/orcamentos) - Sales process

### C. Lower Priority Pages (Utility & Administrative)
1. Settings (/configuracoes) - Configuration
2. Assistant (/assistente) - AI features
3. Cleaning Teams (/equipas-limpeza) - Operations
4. Maintenance (/manutencao) - Facility management
5. Demo Data (/dados-demo) - Development tools

## Test Severity Levels

### Critical (Blocks Core Functionality)
- Page fails to load completely
- Navigation completely broken
- Form submissions fail entirely
- Database operations fail

### High (Impacts User Experience)
- Slow page load times (>3 seconds)
- Missing translations
- Broken interactive elements
- Mobile responsiveness issues

### Medium (Quality Issues)
- Minor UI inconsistencies
- Non-critical form validation issues
- Accessibility problems
- Performance optimization opportunities

### Low (Enhancement Opportunities)
- Minor visual improvements
- Optional feature enhancements
- Code organization improvements
- Documentation updates