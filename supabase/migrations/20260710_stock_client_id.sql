-- Hub client : rattacher le stock aux clients (CDC gestion client + entreposage)
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
CREATE INDEX IF NOT EXISTS idx_stock_items_client_id ON stock_items(client_id);
