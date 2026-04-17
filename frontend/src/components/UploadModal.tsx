import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import { createAsset } from "../api/assets";
import { ASSET_TYPES } from "../types/asset";

interface Props {
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assetType, setAssetType] = useState("image");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("ファイルを選択してください"); return; }
    if (!name.trim()) { setError("資産名を入力してください"); return; }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("asset_type", assetType);
      if (description) fd.append("description", description);
      if (category) fd.append("category", category);
      if (tags) fd.append("tags", tags);
      fd.append("file", file);
      await createAsset(fd);
      onUploaded();
      onClose();
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>資産を追加</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>資産名 *</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="資産名を入力" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>種類 *</label>
            <select style={styles.input} value={assetType} onChange={(e) => setAssetType(e.target.value)}>
              {ASSET_TYPES.filter((t) => t.value).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>カテゴリ</label>
            <input style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例: キャラクター, 背景, UI" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>タグ (カンマ区切り)</label>
            <input style={styles.input} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例: hero, sword, attack" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>説明</label>
            <textarea style={{ ...styles.input, resize: "vertical", minHeight: "72px" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="説明を入力" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>ファイル *</label>
            <div
              style={styles.dropZone}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <span style={{ color: "#2563eb" }}>{file.name}</span>
              ) : (
                <span style={{ color: "#9ca3af" }}>クリックしてファイルを選択</span>
              )}
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>キャンセル</button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "アップロード中..." : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: "16px", padding: "28px", width: "100%",
    maxWidth: "480px", maxHeight: "90vh", overflowY: "auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" },
  close: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" },
  field: { marginBottom: "14px" },
  label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" },
  input: {
    width: "100%", padding: "10px 12px", fontSize: "14px",
    border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box",
  } as CSSProperties,
  dropZone: {
    border: "2px dashed #d1d5db", borderRadius: "8px", padding: "16px",
    textAlign: "center", cursor: "pointer", fontSize: "14px",
  },
  error: { color: "#dc2626", fontSize: "13px", marginBottom: "12px" },
  actions: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" },
  cancelBtn: {
    padding: "10px 20px", fontSize: "14px", border: "1px solid #e5e7eb",
    borderRadius: "8px", background: "#f9fafb", cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 24px", fontSize: "14px", border: "none",
    borderRadius: "8px", background: "#2563eb", color: "#fff",
    cursor: "pointer", fontWeight: 600,
  },
};
