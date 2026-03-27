-- 2026-03-28: Add seller returns + operational costs support

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS bad_quality BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS seller_returns (
  id SERIAL PRIMARY KEY,
  owner_uid VARCHAR(255) NOT NULL,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  lot_id INTEGER NOT NULL REFERENCES inventory_lots(id) ON DELETE CASCADE,
  return_weight_tons NUMERIC(12, 3) NOT NULL CHECK (return_weight_tons > 0),
  return_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (return_amount >= 0),
  return_reason TEXT,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_returns_owner_uid ON seller_returns(owner_uid);
CREATE INDEX IF NOT EXISTS idx_seller_returns_seller_id ON seller_returns(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_returns_lot_id ON seller_returns(lot_id);
CREATE INDEX IF NOT EXISTS idx_seller_returns_return_date ON seller_returns(return_date);

CREATE TABLE IF NOT EXISTS operational_costs (
  id SERIAL PRIMARY KEY,
  owner_uid VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('driver', 'labour', 'other')),
  cost_type VARCHAR(120),
  quantity NUMERIC(12, 3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost NUMERIC(14, 2),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE operational_costs
  ADD COLUMN IF NOT EXISTS cost_type VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_operational_costs_owner_uid ON operational_costs(owner_uid);
CREATE INDEX IF NOT EXISTS idx_operational_costs_cost_date ON operational_costs(cost_date);
CREATE INDEX IF NOT EXISTS idx_operational_costs_category ON operational_costs(category);
CREATE INDEX IF NOT EXISTS idx_operational_costs_cost_type ON operational_costs(cost_type);
