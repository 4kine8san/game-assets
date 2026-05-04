-- ownership_status の値を日本語からコードに変換
UPDATE assets SET ownership_status = 'holding'     WHERE ownership_status = '保有中';
UPDATE assets SET ownership_status = 'listed'      WHERE ownership_status = '出品中';
UPDATE assets SET ownership_status = 'negotiating' WHERE ownership_status = '交渉中';
UPDATE assets SET ownership_status = 'shipped'     WHERE ownership_status = '送付済';
UPDATE assets SET ownership_status = 'transferred' WHERE ownership_status = '譲渡済';

-- カラムのデフォルト値を英語コードに変更
ALTER TABLE assets ALTER COLUMN ownership_status SET DEFAULT 'holding';