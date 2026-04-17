import { useRef } from "react";
import type { CSSProperties } from "react";

export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0 | 90 | 180 | 270
}

interface Props {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

/** Canvas-based clockwise rotation, returns a new File with the rotated image. */
export async function applyRotation(file: File, rotation: number): Promise<File> {
  if (rotation === 0) return file;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const rad = (rotation * Math.PI) / 180;
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("toBlob failed")); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = url;
  });
}

export default function PhotoUpload({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: PhotoItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      rotation: 0,
    }));
    onChange([...photos, ...next]);
  };

  const remove = (id: string) => {
    const item = photos.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  const rotate = (id: string, delta: number) => {
    onChange(photos.map((p) =>
      p.id === id ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 } : p
    ));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...photos];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div>
      <div
        style={styles.dropZone}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <span style={styles.icon}>📷</span>
        <span style={styles.text}>クリックまたはドラッグ＆ドロップで写真を追加</span>
        <span style={styles.hint}>複数選択可 ／ 1枚目がサムネイルになります</span>
        <input
          ref={inputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {photos.length > 0 && (
        <div style={styles.list}>
          {photos.map((item, idx) => (
            <div key={item.id} style={styles.row}>
              <div style={styles.badge}>
                {idx === 0
                  ? <span style={styles.thumbBadge}>サムネイル</span>
                  : <span style={styles.numBadge}>{idx + 1}</span>}
              </div>

              <div style={styles.previewWrap}>
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  style={{ ...styles.preview, transform: `rotate(${item.rotation}deg)` }}
                />
              </div>

              <span style={styles.fname}>{item.file.name}</span>
              {item.rotation !== 0 && (
                <span style={styles.rotLabel}>{item.rotation}°</span>
              )}

              <div style={styles.actions}>
                <button type="button" style={styles.rotBtn} onClick={() => rotate(item.id, -90)} title="左90°回転">↺</button>
                <button type="button" style={styles.rotBtn} onClick={() => rotate(item.id, 90)} title="右90°回転">↻</button>
                <button type="button" style={styles.arrowBtn} onClick={() => move(idx, -1)} disabled={idx === 0} title="上へ">▲</button>
                <button type="button" style={styles.arrowBtn} onClick={() => move(idx, 1)} disabled={idx === photos.length - 1} title="下へ">▼</button>
                <button type="button" style={styles.delBtn} onClick={() => remove(item.id)} title="削除">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  dropZone: {
    border: "2px dashed #94a3b8", borderRadius: "10px", padding: "28px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
    cursor: "pointer", background: "#f8fafc",
  },
  icon: { fontSize: "36px" },
  text: { fontSize: "15px", fontWeight: 600, color: "#334155" },
  hint: { fontSize: "13px", color: "#94a3b8" },
  list: { marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" },
  row: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px",
  },
  badge: { width: "72px", textAlign: "center", flexShrink: 0 },
  thumbBadge: { background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" },
  numBadge: { fontSize: "14px", color: "#64748b", fontWeight: 600 },
  previewWrap: { width: "70px", height: "70px", overflow: "hidden", borderRadius: "6px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" },
  preview: { width: "70px", height: "70px", objectFit: "cover", transition: "transform 0.2s" },
  fname: { flex: 1, fontSize: "14px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rotLabel: { fontSize: "12px", color: "#2563eb", fontWeight: 700, background: "#eff6ff", padding: "2px 8px", borderRadius: "999px", flexShrink: 0 },
  actions: { display: "flex", gap: "5px", flexShrink: 0 },
  rotBtn: { width: "34px", height: "34px", border: "1px solid #bfdbfe", borderRadius: "6px", background: "#eff6ff", cursor: "pointer", fontSize: "16px", color: "#2563eb", fontWeight: 700 },
  arrowBtn: { width: "34px", height: "34px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#f8fafc", cursor: "pointer", fontSize: "13px", color: "#475569" },
  delBtn: { width: "34px", height: "34px", border: "none", borderRadius: "6px", background: "#fee2e2", cursor: "pointer", fontSize: "14px", color: "#dc2626" },
};
