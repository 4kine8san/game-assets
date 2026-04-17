-- Step 1: Add file_data column
ALTER TABLE asset_photos ADD COLUMN IF NOT EXISTS file_data BYTEA;

-- Step 2: Run migrate_photos_to_db.py to populate file_data from files

-- Step 3: Drop old file path column (run after migration script completes)
-- ALTER TABLE asset_photos DROP COLUMN IF EXISTS file_path;
