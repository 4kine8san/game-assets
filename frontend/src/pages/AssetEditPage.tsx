import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { searchGameInfo } from "../api/search";
import {
  fetchAsset, updateAsset, deleteAsset,
  addPhotos, rotatePhoto, reorderPhotos, deletePhoto as apiDeletePhoto,
} from "../api/assets";
import type { AssetPhoto } from "../types/asset";
import PhotoUpload from "../components/PhotoUpload";
import type { PhotoItem } from "../components/photoUtils";
import { applyRotation } from "../components/photoUtils";
import { useMasters } from "../contexts/MastersContext";
import { API_BASE_URL } from "../config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingPhoto {
  id: number;
  file_name: string;
  url: string;
  thumb_url?: string;
  sort_order: number;
  rotation: number;    // accumulated pending rotation (0/90/180/270)
  deleted: boolean;
}

interface FormState {
  name: string;
  asset_category: "consumer" | "arcade" | "hardware" | "other";
  hardware: string;
  maker: string;
  genre: string;
  edition: string;
  official_url: string;
  release_year: string;
  condition: string;
  asset_value: string;
  tags: string;
  description: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssetEditPage() {
  const { id } = useParams<{ id: string }>();
  const assetId = Number(id);
  const navigate = useNavigate();
  const { category, hardware, genre, edition, condition } = useMasters();

  const [form, setForm] = useState<FormState>({
    name: "", asset_category: "consumer", hardware: "", maker: "",
    genre: "", edition: "", official_url: "", release_year: "", condition: "", asset_value: "", tags: "", description: "",
  });
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  // ── Lightbox ESC key ────────────────────────────────────────────────────────
  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  // ── Load asset ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAsset(assetId).then((asset) => {
      setForm({
        name: asset.name,
        asset_category: asset.asset_category,
        hardware: asset.hardware ?? "",
        maker: asset.maker ?? "",
        genre: asset.genre ?? "",
        edition: asset.edition ?? "",
        official_url: asset.official_url ?? "",
        release_year: asset.release_year ?? "",
        condition: asset.condition ?? "",
        asset_value: asset.asset_value != null ? String(asset.asset_value) : "",
        tags: asset.tags ?? "",
        description: asset.description ?? "",
      });
      setExistingPhotos(
        asset.photos.map((p: AssetPhoto) => ({
          id: p.id, file_name: p.file_name,
          url: `${API_BASE_URL}${p.url}`,
          thumb_url: p.thumb_url ? `${API_BASE_URL}${p.thumb_url}` : undefined,
          sort_order: p.sort_order,
          rotation: 0, deleted: false,
        }))
      );
      setLoading(false);
    }).catch(() => { setError("データの読み込みに失敗しました"); setLoading(false); });
  }, [assetId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Existing photo actions ──────────────────────────────────────────────────
  const rotatePending = (photoId: number, delta: number) => {
    setExistingPhotos((ps) => ps.map((p) =>
      p.id === photoId ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 } : p
    ));
  };

  const markDeleted = (photoId: number) => {
    if (!confirm("この写真を削除しますか？")) return;
    setExistingPhotos((ps) => ps.map((p) => p.id === photoId ? { ...p, deleted: true } : p));
  };

  const moveExisting = (idx: number, dir: -1 | 1) => {
    const visible = existingPhotos.filter((p) => !p.deleted);
    const swap = idx + dir;
    if (swap < 0 || swap >= visible.length) return;
    const next = [...existingPhotos];
    const a = next.indexOf(visible[idx]);
    const b = next.indexOf(visible[swap]);
    [next[a], next[b]] = [next[b], next[a]];
    setExistingPhotos(next);
  };

  // ── Search game info ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!form.name.trim()) { setSearchMsg("先に資産名を入力してください"); return; }
    setSearching(true);
    setSearchMsg("");
    try {
      const result = await searchGameInfo(form.name.trim());
      if (!result.found) { setSearchMsg("ゲーム情報が見つかりませんでした"); return; }
      setForm((f) => ({
        ...f,
        maker: result.maker ?? f.maker,
        genre: result.genre ?? f.genre,
        release_year: result.release_year ?? f.release_year,
        official_url: result.official_url ?? f.official_url,
      }));
      setSearchMsg(`「${result.source_title}」の情報を入力しました`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSearchMsg(msg ?? "検索に失敗しました");
    } finally {
      setSearching(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("資産名を入力してください"); return; }
    setSaving(true);
    setError("");

    try {
      // 1. Update text fields
      await updateAsset(assetId, {
        name: form.name.trim(),
        asset_category: form.asset_category,
        hardware: form.hardware || null,
        maker: form.maker || null,
        genre: form.genre || null,
        edition: form.edition || null,
        official_url: form.official_url || null,
        release_year: form.release_year || null,
        condition: form.condition || null,
        asset_value: form.asset_value ? Number(form.asset_value) : null,
        tags: form.tags || null,
        description: form.description || null,
      });

      // 2. Delete marked photos
      const toDelete = existingPhotos.filter((p) => p.deleted);
      for (const p of toDelete) await apiDeletePhoto(assetId, p.id);

      // 3. Rotate existing photos
      const toRotate = existingPhotos.filter((p) => !p.deleted && p.rotation !== 0);
      for (const p of toRotate) await rotatePhoto(assetId, p.id, p.rotation);

      // 4. Upload new photos (with canvas rotation applied)
      let uploadedIds: number[] = [];
      if (newPhotos.length > 0) {
        const fd = new FormData();
        for (const np of newPhotos) {
          const f = await applyRotation(np.file, np.rotation);
          fd.append("photos", f);
        }
        const updated = await addPhotos(assetId, fd);
        const prevIds = new Set(existingPhotos.map((p) => p.id));
        uploadedIds = updated.photos
          .filter((p: AssetPhoto) => !prevIds.has(p.id))
          .map((p: AssetPhoto) => p.id);
      }

      // 5. Reorder: visible existing (in display order) + new uploads
      const visibleExisting = existingPhotos
        .filter((p) => !p.deleted)
        .map((p) => p.id);
      const finalOrder = [...visibleExisting, ...uploadedIds];
      if (finalOrder.length > 0) await reorderPhotos(assetId, finalOrder);

      navigate("/");
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete asset ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm(`「${form.name}」を完全に削除します。この操作は取り消せません。\n本当に削除しますか？`)) return;
    try {
      await deleteAsset(assetId);
      navigate("/");
    } catch {
      setError("削除に失敗しました");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <div style={styles.center}>読み込み中...</div>;

  const visiblePhotos = existingPhotos.filter((p) => !p.deleted);
  const allPhotoCount = visiblePhotos.length + newPhotos.length;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1 style={styles.title}>ゲーム資産を編集</h1>
        <button style={styles.deleteBtn} onClick={handleDelete}>🗑 削除する</button>
      </div>

      {lightbox && (
        <div style={styles.overlay} onClick={() => setLightbox(null)}>
          <button style={styles.overlayClose} onClick={() => setLightbox(null)}>✕</button>
          <img
            src={lightbox}
            alt="原寸表示"
            style={styles.overlayImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <form onSubmit={handleSave} style={styles.form}>
        {/* ── 基本情報 ── */}
        <div style={styles.card}>
          <h2 style={styles.section}>基本情報</h2>

          <Field label="資産名" required>
            <div style={styles.nameRow}>
              <input style={{ ...styles.input, flex: 1 }} value={form.name} onChange={(e) => set("name", e.target.value)} />
              <button type="button" style={styles.searchBtn} onClick={handleSearch} disabled={searching}>
                {searching ? "検索中..." : "🔍 情報を自動入力"}
              </button>
            </div>
            {searchMsg && (
              <div style={{ ...styles.searchMsg, color: searchMsg.includes("失敗") || searchMsg.includes("見つかり") || (searchMsg.includes("入力") && !searchMsg.includes("しました")) ? "#dc2626" : "#16a34a" }}>
                {searchMsg}
              </div>
            )}
          </Field>

          <Field label="種類" required>
            <div style={styles.radioGroup}>
              {category.map((o) => (
                <label key={o.value} style={styles.radioLabel}>
                  <input type="radio" value={o.value} checked={form.asset_category === o.value} onChange={() => set("asset_category", o.value as FormState["asset_category"])} />
                  <span style={styles.radioText}>{o.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="ハード">
            <select style={styles.select} value={form.hardware} onChange={(e) => set("hardware", e.target.value)}>
              <option value="">選択してください</option>
              {hardware.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="ゲームメーカー">
            <input style={styles.input} value={form.maker} onChange={(e) => set("maker", e.target.value)} placeholder="例: カプコン、任天堂、セガ" />
          </Field>

          <div style={styles.row2}>
            <Field label="ジャンル">
              <select style={styles.select} value={form.genre} onChange={(e) => set("genre", e.target.value)}>
                <option value="">選択してください</option>
                {genre.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="エディション">
              <select style={styles.select} value={form.edition} onChange={(e) => set("edition", e.target.value)}>
                <option value="">選択してください</option>
                {edition.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="公式サイト URL">
            <input style={styles.input} type="url" value={form.official_url} onChange={(e) => set("official_url", e.target.value)} placeholder="https://..." />
          </Field>

          <Field label="販売年">
            <input style={styles.input} value={form.release_year} onChange={(e) => set("release_year", e.target.value)} placeholder="例: 1992" maxLength={10} />
          </Field>

          <Field label="状態">
            <select style={styles.select} value={form.condition} onChange={(e) => set("condition", e.target.value)}>
              <option value="">選択してください</option>
              {condition.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="資産評価額（円）">
            <input
              style={styles.input}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.asset_value}
              onChange={(e) => set("asset_value", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="例: 3000"
            />
          </Field>

          <Field label="タグ" hint="カンマ区切りで複数入力できます">
            <input style={styles.input} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="格闘, カプコン, 名作" />
          </Field>

          <Field label="説明">
            <textarea style={styles.textarea} value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
          </Field>
        </div>

        {/* ── 写真 ── */}
        <div style={styles.card}>
          <h2 style={styles.section}>
            写真
            <span style={styles.photoCount}>{allPhotoCount}枚</span>
          </h2>

          {/* 既存写真 */}
          {visiblePhotos.length > 0 && (
            <div style={styles.photoList}>
              {visiblePhotos.map((photo, idx) => (
                <div key={photo.id} style={styles.photoRow}>
                  <div style={styles.badge}>
                    {idx === 0
                      ? <span style={styles.thumbBadge}>サムネイル</span>
                      : <span style={styles.numBadge}>{idx + 1}</span>}
                  </div>

                  <div style={styles.previewWrap} onClick={() => setLightbox(photo.url)} title="クリックで原寸表示">
                    <img
                      src={photo.thumb_url || photo.url}
                      alt={photo.file_name}
                      style={{ ...styles.preview, transform: `rotate(${photo.rotation}deg)` }}
                      onError={(e) => { (e.target as HTMLImageElement).src = photo.url; }}
                    />
                  </div>

                  <span style={styles.fname}>{photo.file_name}</span>
                  {photo.rotation !== 0 && (
                    <span style={styles.rotLabel}>{photo.rotation}°(保存時に適用)</span>
                  )}

                  <div style={styles.actions}>
                    <button type="button" style={styles.rotBtn} onClick={() => rotatePending(photo.id, -90)} title="左90°">↺</button>
                    <button type="button" style={styles.rotBtn} onClick={() => rotatePending(photo.id, 90)} title="右90°">↻</button>
                    <button type="button" style={styles.arrowBtn} onClick={() => moveExisting(idx, -1)} disabled={idx === 0} title="上へ">▲</button>
                    <button type="button" style={styles.arrowBtn} onClick={() => moveExisting(idx, 1)} disabled={idx === visiblePhotos.length - 1} title="下へ">▼</button>
                    <button type="button" style={styles.delPhotoBtn} onClick={() => markDeleted(photo.id)} title="削除">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 新規追加 */}
          <div style={visiblePhotos.length > 0 ? { marginTop: "18px" } : {}}>
            {newPhotos.length > 0 && (
              <div style={styles.newLabel}>追加する写真（未保存）</div>
            )}
            <PhotoUpload photos={newPhotos} onChange={setNewPhotos} />
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.btnRow}>
          <button type="button" style={styles.cancelBtn} onClick={() => navigate("/")}>キャンセル</button>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={fld.label}>
        {label}
        {required && <span style={fld.req}>必須</span>}
      </label>
      {hint && <div style={fld.hint}>{hint}</div>}
      {children}
    </div>
  );
}

const fld: Record<string, CSSProperties> = {
  label: { display: "block", fontSize: "15px", fontWeight: 700, color: "#334155", marginBottom: "6px" },
  req: { marginLeft: "8px", fontSize: "11px", background: "#dc2626", color: "#fff", padding: "2px 7px", borderRadius: "999px", fontWeight: 700 },
  hint: { fontSize: "13px", color: "#94a3b8", marginBottom: "6px" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: "820px", margin: "0 auto", padding: "28px 24px", background: "#f0fdf4", minHeight: "100vh" },
  center: { textAlign: "center", padding: "80px", fontSize: "16px", color: "#64748b" },
  topBar: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" },
  backBtn: { padding: "9px 18px", fontSize: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" },
  title: { flex: 1, margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" },
  deleteBtn: { padding: "9px 18px", fontSize: "15px", border: "1px solid #fca5a5", borderRadius: "8px", background: "#fef2f2", cursor: "pointer", color: "#dc2626", fontWeight: 700, whiteSpace: "nowrap" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px 28px" },
  section: { margin: "0 0 20px", fontSize: "17px", fontWeight: 700, color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "10px" },
  photoCount: { fontSize: "13px", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "2px 10px", borderRadius: "999px" },
  input: { width: "100%", padding: "12px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" } as CSSProperties,
  select: { width: "100%", padding: "12px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", boxSizing: "border-box" } as CSSProperties,
  textarea: { width: "100%", padding: "12px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", resize: "vertical", boxSizing: "border-box" } as CSSProperties,
  radioGroup: { display: "flex", gap: "24px" },
  radioLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  radioText: { fontSize: "15px", color: "#334155" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  // photo list
  photoList: { display: "flex", flexDirection: "column", gap: "10px" },
  photoRow: { display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px" },
  badge: { width: "72px", textAlign: "center", flexShrink: 0 },
  thumbBadge: { background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" },
  numBadge: { fontSize: "14px", color: "#64748b", fontWeight: 600 },
  previewWrap: { width: "70px", height: "70px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#e2e8f0", cursor: "zoom-in" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" } as CSSProperties,
  overlayImg: { maxWidth: "90vw", maxHeight: "90vh", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" } as CSSProperties,
  overlayClose: { position: "absolute", top: "20px", right: "24px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "40px", height: "40px", fontSize: "18px", color: "#fff", cursor: "pointer", zIndex: 1001 } as CSSProperties,
  preview: { width: "70px", height: "70px", objectFit: "cover", transition: "transform 0.25s" },
  fname: { flex: 1, fontSize: "14px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rotLabel: { fontSize: "11px", color: "#f59e0b", fontWeight: 700, background: "#fefce8", padding: "2px 8px", borderRadius: "999px", flexShrink: 0 },
  actions: { display: "flex", gap: "5px", flexShrink: 0 },
  rotBtn: { width: "34px", height: "34px", border: "1px solid #bfdbfe", borderRadius: "6px", background: "#eff6ff", cursor: "pointer", fontSize: "16px", color: "#2563eb", fontWeight: 700 },
  arrowBtn: { width: "34px", height: "34px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#475569" },
  delPhotoBtn: { width: "34px", height: "34px", border: "none", borderRadius: "6px", background: "#fee2e2", cursor: "pointer", fontSize: "14px", color: "#dc2626" },
  newLabel: { fontSize: "13px", fontWeight: 700, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "6px 12px", marginBottom: "10px" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "14px 18px", color: "#dc2626", fontSize: "15px" },
  btnRow: { display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "40px" },
  cancelBtn: { padding: "13px 28px", fontSize: "16px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc", cursor: "pointer", color: "#64748b" },
  saveBtn: { padding: "13px 36px", fontSize: "16px", fontWeight: 700, border: "none", borderRadius: "10px", background: "#2563eb", color: "#fff", cursor: "pointer" },
  nameRow: { display: "flex", gap: "10px", alignItems: "stretch" },
  searchBtn: { padding: "0 18px", fontSize: "14px", fontWeight: 700, border: "none", borderRadius: "8px", background: "#0f766e", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" },
  searchMsg: { marginTop: "6px", fontSize: "13px", fontWeight: 600 },
};
