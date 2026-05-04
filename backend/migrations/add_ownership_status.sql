-- 保有状況カラムを追加（既存データは一律「保有中」で埋める）
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS ownership_status VARCHAR(20) NOT NULL DEFAULT '保有中';