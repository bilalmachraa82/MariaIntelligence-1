-- Adicionar colunas de quartos e banheiros na tabela de orçamentos
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER;

-- Atualizar registros existentes com valores padrão
UPDATE quotations SET bedrooms = 1, bathrooms = 1 WHERE bedrooms IS NULL;