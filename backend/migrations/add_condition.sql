ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition VARCHAR(20);

INSERT INTO masters (master_type, value, label, sort_order)
VALUES
  ('condition', 'new',      '新品',   1),
  ('condition', 'like_new', '新古品', 2),
  ('condition', 'used',     '中古',   3)
ON CONFLICT (master_type, value) DO NOTHING;
