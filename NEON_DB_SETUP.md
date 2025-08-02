# 🗄️ Configuração do Neon DB - Maria Faz

## ⚠️ IMPORTANTE: Configuração Necessária

O sistema está configurado para usar Neon DB mas a variável `DATABASE_URL` não está definida no `.env`.

## 📋 Passos para Configurar:

### 1. Criar conta no Neon (se ainda não tiver)
- Acesse: https://neon.tech
- Crie uma conta gratuita
- Crie um novo projeto

### 2. Obter a Connection String
No dashboard do Neon:
1. Selecione seu projeto
2. Vá para "Connection Details"
3. Copie a connection string (formato: `postgresql://...`)

### 3. Adicionar ao .env
Adicione no arquivo `.env`:
```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### 4. Estrutura do Banco de Dados

O sistema já tem schemas definidos em `/shared/schema.ts` para:
- `properties` - Propriedades/Imóveis
- `owners` - Proprietários
- `reservations` - Reservas
- `guests` - Hóspedes
- `cleaningTeams` - Equipes de limpeza
- `cleaningSchedules` - Agendamentos de limpeza
- `maintenanceTasks` - Tarefas de manutenção
- `payments` - Pagamentos
- `quotations` - Orçamentos
- `users` - Usuários do sistema

### 5. Rodar Migrações

Após configurar a DATABASE_URL:
```bash
npm run db:migrate
```

## 🔧 Alternativa Temporária (Desenvolvimento Local)

Se quiser testar sem Neon por agora, podemos:
1. Usar SQLite local
2. Usar dados em memória (IndexedDB no frontend)
3. Mock dos endpoints de API

## 📝 Notas

- O Neon oferece um plano gratuito com 0.5 GB de storage
- É PostgreSQL completo, ideal para produção
- Suporta branching (útil para desenvolvimento)
- Tem backups automáticos

## ⚡ Próximos Passos

1. Configure a DATABASE_URL
2. Execute as migrações
3. Popule com dados reais via importação PDF
4. Teste todas as funcionalidades

---

**Status Atual**: Sistema configurado mas sem conexão com banco de dados