-- Adicionar novas colunas à tabela de reservas
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS num_adults INTEGER DEFAULT 1;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS num_children INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reference TEXT;