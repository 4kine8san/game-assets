"""
サムネイルファイルを DB に移行するスクリプト。

実行順序:
  1. thumbs_to_db.sql の Step 1 を実行（thumb_data カラム追加）
  2. このスクリプトを実行（ファイル → DB 移行 & ファイル削除）
  3. thumbs_to_db.sql の Step 3 を実行（thumb_path カラム削除）

実行方法:
  cd backend
  python -m migrations.migrate_thumbs_to_db
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
            text("SELECT id, thumb_path FROM asset_photos WHERE thumb_path IS NOT NULL")
        ).fetchall()

        if not rows:
            print("移行対象なし（thumb_path が NULL のレコードのみ）")
            return

        migrated, skipped = 0, 0
        for photo_id, thumb_path in rows:
            if not thumb_path or not os.path.exists(thumb_path):
                print(f"  スキップ id={photo_id}: ファイル不在 ({thumb_path})")
                skipped += 1
                continue
            with open(thumb_path, "rb") as f:
                data = f.read()
            db.execute(
                text("UPDATE asset_photos SET thumb_data = :data WHERE id = :id"),
                {"data": data, "id": photo_id},
            )
            os.remove(thumb_path)
            print(f"  移行完了 id={photo_id}: {thumb_path}")
            migrated += 1

        db.commit()
        print(f"\n完了: {migrated} 件移行, {skipped} 件スキップ")
        print("次のステップ: thumbs_to_db.sql の Step 3（DROP COLUMN）を実行してください")
    except Exception as e:
        db.rollback()
        print(f"エラー: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
