"""
オリジナル写真ファイルを DB に移行するスクリプト。

実行順序:
  1. photos_to_db.sql の Step 1 を実行（file_data カラム追加）
  2. このスクリプトを実行（ファイル → DB 移行 & ファイル削除）
  3. photos_to_db.sql の Step 3 を実行（file_path カラム削除）

実行方法:
  cd backend
  py migrations/migrate_photos_to_db.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.database import SessionLocal


def migrate():
    db = SessionLocal()
    try:
        rows = db.execute(
            text("SELECT id, file_path FROM asset_photos WHERE file_path IS NOT NULL")
        ).fetchall()

        if not rows:
            print("移行対象なし")
            return

        migrated, skipped = 0, 0
        for photo_id, file_path in rows:
            if not file_path or not os.path.exists(file_path):
                print(f"  スキップ id={photo_id}: ファイル不在 ({file_path})")
                skipped += 1
                continue
            with open(file_path, "rb") as f:
                data = f.read()
            db.execute(
                text("UPDATE asset_photos SET file_data = :data WHERE id = :id"),
                {"data": data, "id": photo_id},
            )
            os.remove(file_path)
            print(f"  移行完了 id={photo_id}: {file_path}")
            migrated += 1

        db.commit()
        print(f"\n完了: {migrated} 件移行, {skipped} 件スキップ")
        print("次のステップ: photos_to_db.sql の Step 3（DROP COLUMN）を実行してください")
    except Exception as e:
        db.rollback()
        print(f"エラー: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
