import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { createAsset } from "../api/assets";
import { searchGameInfo } from "../api/search";
import PhotoUpload from "../components/PhotoUpload";
import type { PhotoItem } from "../components/PhotoUpload";
import { applyRotation } from "../components/PhotoUpload";
import { useMasters } from "../contexts/MastersContext";

interface FormState {
  name: string;
  asset_category: "consumer" | "arcade" | "hardware" | "other";
  hardware: string;
  maker: string;
  genre: string;
  edition: string;
  official_url: string;
  release_year: string;
  asset_value: string;
  tags: string;
  description: string;
}

const INIT: FormState = {
  name: "", asset_category: "consumer", hardware: "", maker: "",
  genre: "", edition: "", official_url: "", release_year: "", asset_value: "", tags: "", description: "",
};

export default function AssetRegisterPage() {
  const navigate = useNavigate();
  const { category, hardware, genre, edition } = useMasters();
  const [form, setForm] = useState<FormState>(INIT);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSearch = async () => {
    if (!form.name.trim()) { setSearchMsg("先に資産名を入力してください"); return; }
    setSearching(true);
    setSearchMsg("");
    try {
      const result = await searchGameInfo(form.name.trim());
      if (!result.found) {
        setSearchMsg("ゲーム情報が見つかりませんでした");
        return;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("資産名を入力してください"); return; }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("asset_category", form.asset_category);
      if (form.hardware) fd.append("hardware", form.hardware);
      if (form.maker) fd.append("maker", form.maker);
      if (form.genre) fd.append("genre", form.genre);
      if (form.edition) fd.append("edition", form.edition);
      if (form.official_url) fd.append("official_url", form.official_url);
      if (form.release_year) fd.append("release_year", form.release_year);
      if (form.asset_value) fd.append("asset_value", form.asset_value);
      if (form.tags) fd.append("tags", form.tags);
      if (form.description) fd.append("description", form.description);
      for (const p of photos) {
        const f = await applyRotation(p.file, p.rotation);
        fd.append("photos", f);
      }
      await createAsset(fd);
      navigate("/");
    } catch {
      setError("登録に失敗しました。入力内容を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1 style={styles.title}>ゲーム資産を登録</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.card}>
          <h2 style={styles.section}>基本情報</h2>

          <Field label="資産名" required>
            <div style={styles.nameRow}>
              <input style={{ ...styles.input, flex: 1 }} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例: ストリートファイターII" />
              <button type="button" style={styles.searchBtn} onClick={handleSearch} disabled={searching}>
                {searching ? "検索中..." : "🔍 情報を自動入力"}
              </button>
            </div>
            {searchMsg && (
              <div style={{ ...styles.searchMsg, color: searchMsg.includes("失敗") || searchMsg.includes("見つかり") || searchMsg.includes("入力") && !searchMsg.includes("しました") ? "#dc2626" : "#16a34a" }}>
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

          <Field label="資産評価額（円）">
            <input style={styles.input} type="number" min="0" value={form.asset_value} onChange={(e) => set("asset_value", e.target.value)} placeholder="例: 3000" />
          </Field>

          <Field label="タグ" hint="カンマ区切りで複数入力できます（例: 格闘, カプコン, 名作）">
            <input style={styles.input} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="格闘, カプコン, 名作" />
          </Field>

          <Field label="説明">
            <textarea style={styles.textarea} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="ゲームの説明を入力してください..." rows={4} />
          </Field>
        </div>

        <div style={styles.card}>
          <h2 style={styles.section}>写真</h2>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.btnRow}>
          <button type="button" style={styles.cancelBtn} onClick={() => navigate("/")}>キャンセル</button>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "登録中..." : "登録する"}
          </button>
        </div>
      </form>
    </div>
  );
}

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

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: "820px", margin: "0 auto", padding: "28px 24px", background: "#f0fdf4", minHeight: "100vh" },
  topBar: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" },
  backBtn: { padding: "9px 18px", fontSize: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" },
  title: { margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px 28px" },
  section: { margin: "0 0 20px", fontSize: "17px", fontWeight: 700, color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" },
  input: { width: "100%", padding: "12px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", boxSizing: "border-box" } as CSSProperties,
  select: { width: "100%", padding: "12px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", boxSizing: "border-box" } as CSSProperties,
  textarea: { width: "100%", padding: "12px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", resize: "vertical", boxSizing: "border-box" } as CSSProperties,
  radioGroup: { display: "flex", gap: "24px" },
  radioLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  radioText: { fontSize: "15px", color: "#334155" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "14px 18px", color: "#dc2626", fontSize: "15px" },
  btnRow: { display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "40px" },
  cancelBtn: { padding: "13px 28px", fontSize: "16px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc", cursor: "pointer", color: "#64748b" },
  submitBtn: { padding: "13px 36px", fontSize: "16px", fontWeight: 700, border: "none", borderRadius: "10px", background: "#2563eb", color: "#fff", cursor: "pointer" },
  nameRow: { display: "flex", gap: "10px", alignItems: "stretch" },
  searchBtn: { padding: "0 18px", fontSize: "14px", fontWeight: 700, border: "none", borderRadius: "8px", background: "#0f766e", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" },
  searchMsg: { marginTop: "6px", fontSize: "13px", fontWeight: 600 },
};
