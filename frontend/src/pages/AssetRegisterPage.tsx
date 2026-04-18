import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAsset } from "../api/assets";
import { searchGameInfo } from "../api/search";
import PhotoUpload from "../components/PhotoUpload";
import type { PhotoItem } from "../components/photoUtils";
import { applyRotation } from "../components/photoUtils";
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
  condition: string;
  asset_value: string;
  tags: string;
  description: string;
}

const INIT: FormState = {
  name: "", asset_category: "consumer", hardware: "", maker: "",
  genre: "", edition: "", official_url: "", release_year: "", condition: "", asset_value: "", tags: "", description: "",
};

export default function AssetRegisterPage() {
  const navigate = useNavigate();
  const { category, hardware, genre, edition, condition } = useMasters();
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      if (form.condition) fd.append("condition", form.condition);
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

  const inputClass = "w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg box-border";
  const selectClass = "w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg bg-white box-border";

  return (
    <div className="max-w-[820px] mx-auto px-6 py-7 min-h-screen">
      <div className="flex items-center gap-4 mb-5">
        <button className="py-2.5 px-4 text-[15px] border border-slate-200 rounded-lg bg-white cursor-pointer text-slate-600 whitespace-nowrap" onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1 className="m-0 text-[22px] font-extrabold text-slate-900">ゲーム資産を登録</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="bg-white border border-slate-200 rounded-[14px] p-6 px-7">
          <h2 className="m-0 mb-5 text-[17px] font-bold text-slate-800 border-b-2 border-slate-200 pb-2.5">基本情報</h2>

          <Field label="資産名" required>
            <div className="flex gap-2.5 items-stretch">
              <input className={`${inputClass} flex-1`} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例: ストリートファイターII" />
              <button type="button" className="px-4 text-sm font-bold border-none rounded-lg bg-teal-700 text-white cursor-pointer whitespace-nowrap" onClick={handleSearch} disabled={searching}>
                {searching ? "検索中..." : "🔍 情報を自動入力"}
              </button>
            </div>
            {searchMsg && (
              <div className={`mt-1.5 text-[13px] font-semibold${searchMsg.includes("失敗") || searchMsg.includes("見つかり") || (searchMsg.includes("入力") && !searchMsg.includes("しました")) ? " text-red-600" : " text-green-600"}`}>
                {searchMsg}
              </div>
            )}
          </Field>

          <Field label="種類" required>
            <div className="flex gap-6">
              {category.map((o) => (
                <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={o.value} checked={form.asset_category === o.value} onChange={() => set("asset_category", o.value as FormState["asset_category"])} />
                  <span className="text-[15px] text-slate-700">{o.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="ハード">
            <select className={selectClass} value={form.hardware} onChange={(e) => set("hardware", e.target.value)}>
              <option value="">選択してください</option>
              {hardware.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="ゲームメーカー">
            <input className={inputClass} value={form.maker} onChange={(e) => set("maker", e.target.value)} placeholder="例: カプコン、任天堂、セガ" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="ジャンル">
              <select className={selectClass} value={form.genre} onChange={(e) => set("genre", e.target.value)}>
                <option value="">選択してください</option>
                {genre.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="エディション">
              <select className={selectClass} value={form.edition} onChange={(e) => set("edition", e.target.value)}>
                <option value="">選択してください</option>
                {edition.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="公式サイト URL">
            <input className={inputClass} type="url" value={form.official_url} onChange={(e) => set("official_url", e.target.value)} placeholder="https://..." />
          </Field>

          <Field label="販売年">
            <input className={inputClass} value={form.release_year} onChange={(e) => set("release_year", e.target.value)} placeholder="例: 1992" maxLength={10} />
          </Field>

          <Field label="状態">
            <select className={selectClass} value={form.condition} onChange={(e) => set("condition", e.target.value)}>
              <option value="">選択してください</option>
              {condition.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="資産評価額（円）">
            <input
              className={inputClass}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.asset_value}
              onChange={(e) => set("asset_value", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="例: 3000"
            />
          </Field>

          <Field label="タグ" hint="カンマ区切りで複数入力できます（例: 格闘, カプコン, 名作）">
            <input className={inputClass} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="格闘, カプコン, 名作" />
          </Field>

          <Field label="説明">
            <textarea className="w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg resize-y box-border" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="ゲームの説明を入力してください..." rows={4} />
          </Field>
        </div>

        <div className="bg-white border border-slate-200 rounded-[14px] p-6 px-7">
          <h2 className="m-0 mb-5 text-[17px] font-bold text-slate-800 border-b-2 border-slate-200 pb-2.5">写真</h2>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 px-[18px] text-red-600 text-[15px]">{error}</div>}

        <div className="flex gap-3 justify-end pb-10">
          <button type="button" className="py-3.5 px-7 text-base border border-slate-200 rounded-xl bg-slate-50 cursor-pointer text-slate-500" onClick={() => navigate("/")}>キャンセル</button>
          <button type="submit" className="py-3.5 px-9 text-base font-bold border-none rounded-xl bg-blue-600 text-white cursor-pointer disabled:opacity-60" disabled={loading}>
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
    <div className="mb-[18px]">
      <label className="block text-[15px] font-bold text-slate-700 mb-1.5">
        {label}
        {required && <span className="ml-2 text-[11px] bg-red-600 text-white py-0.5 px-[7px] rounded-full font-bold">必須</span>}
      </label>
      {hint && <div className="text-[13px] text-slate-400 mb-1.5">{hint}</div>}
      {children}
    </div>
  );
}
