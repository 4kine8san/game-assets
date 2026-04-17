-- Step 1: Add thumb_data column
ALTER TABLE asset_photos ADD COLUMN IF NOT EXISTS thumb_data BYTEA;

-- Step 2: Run migrate_thumbs_to_db.py to populate thumb_data from files

-- Step 3: Drop old file path column (run after migration script completes)
-- ALTER TABLE asset_photos DROP COLUMN IF EXISTS thumb_path;
