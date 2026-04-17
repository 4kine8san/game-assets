INSERT INTO masters (master_type, value, label, sort_order)
VALUES ('category', 'hardware', 'ハード', 2)
ON CONFLICT (master_type, value) DO NOTHING;

UPDATE masters SET sort_order = 3 WHERE master_type = 'category' AND value = 'other';
