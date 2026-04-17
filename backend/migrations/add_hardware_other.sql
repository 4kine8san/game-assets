INSERT INTO masters (master_type, value, label, sort_order)
VALUES ('hardware', 'other', 'その他', 20)
ON CONFLICT (master_type, value) DO NOTHING;
