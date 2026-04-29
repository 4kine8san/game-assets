import { useState, useEffect, useCallback, type SubmitEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { searchGameInfo } from "../api/search";
import {
  fetchAsset, updateAsset, deleteAsset, copyAsset,
  addPhotos, rotatePhoto, reorderPhotos, deletePhoto as apiDeletePhoto,
} from "../api/assets";
import type { AssetPhoto } from "../types/asset";
import PhotoUpload from "../components/PhotoUpload";
import type { PhotoItem } from "../components/photoUtils";
import { applyRotation } from "../components/photoUtils";
import { useMasters } from "../contexts/MastersContext";
import { useAdmin } from "../contexts/AdminContext";
import { API_BASE_URL } from "../config";
import { MESSAGES } from "../constants/messages";
import { getApiErrorDetail } from "../utils/apiError";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingPhoto {
  id: number;
  file_name: string;
  url: string;
  thumb_url?: string;
  sort_order: number;
  rotation: number;
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
  const { isAdmin } = useAdmin();
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
  const [isSearchError, setIsSearchError] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

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
    }).catch(() => { setError(MESSAGES.ERR_LOAD_FAILED); setLoading(false); });
  }, [assetId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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

  const handleSearch = async () => {
    if (!form.name.trim()) {
      setSearchMsg(MESSAGES.ERR_NAME_REQUIRED_FOR_SEARCH);
      setIsSearchError(true);
      return;
    }
    setSearching(true);
    setSearchMsg("");
    try {
      const result = await searchGameInfo(form.name.trim());
      if (!result.found) {
        setSearchMsg(MESSAGES.INFO_GAME_NOT_FOUND);
        setIsSearchError(true);
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
      setIsSearchError(false);
    } catch (e: unknown) {
      setSearchMsg(getApiErrorDetail(e) ?? MESSAGES.ERR_SEARCH_FAILED);
      setIsSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(MESSAGES.ERR_NAME_REQUIRED); return; }
    setSaving(true);
    setError("");
    try {
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
      const toDelete = existingPhotos.filter((p) => p.deleted);
      for (const p of toDelete) await apiDeletePhoto(assetId, p.id);
      const toRotate = existingPhotos.filter((p) => !p.deleted && p.rotation !== 0);
      for (const p of toRotate) await rotatePhoto(assetId, p.id, p.rotation);
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
      const visibleExisting = existingPhotos.filter((p) => !p.deleted).map((p) => p.id);
      const finalOrder = [...visibleExisting, ...uploadedIds];
      if (finalOrder.length > 0) await reorderPhotos(assetId, finalOrder);
      navigate("/");
    } catch {
      setError(MESSAGES.ERR_SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${form.name}」を完全に削除します。この操作は取り消せません。\n本当に削除しますか？`)) return;
    try {
      await deleteAsset(assetId);
      navigate("/");
    } catch {
      setError(MESSAGES.ERR_DELETE_FAILED);
    }
  };

  const handleCopy = async () => {
    if (!confirm(`「${form.name}」のコピーを作成します。写真はコピーされません。\n続けますか？`)) return;
    try {
      const copied = await copyAsset(assetId);
      navigate(`/assets/${copied.id}/edit`);
    } catch {
      setError(MESSAGES.ERR_COPY_FAILED);
    }
  };

  if (loading) return <div className="text-center p-20 text-base text-slate-500">読み込み中...</div>;

  const visiblePhotos = existingPhotos.filter((p) => !p.deleted);
  const allPhotoCount = visiblePhotos.length + newPhotos.length;

  const inputClass = "w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg box-border";
  const selectClass = "w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg bg-white box-border";

  return (
    <div className="max-w-[820px] mx-auto px-6 py-7 min-h-screen">
      <div className="flex items-center gap-3.5 mb-5">
        <button className="py-2.5 px-4 text-[15px] border border-slate-200 rounded-lg bg-white cursor-pointer text-slate-600 whitespace-nowrap" onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1 className="flex-1 m-0 text-[22px] font-extrabold text-slate-900">{isAdmin ? "ゲーム資産を編集" : "ゲーム資産の詳細"}</h1>
        {!isAdmin && <span className="text-[13px] font-bold text-slate-400 bg-slate-100 py-1 px-3 rounded-full">閲覧モード</span>}
        {isAdmin && <button className="py-2.5 px-4 text-[15px] border border-slate-300 rounded-lg bg-white cursor-pointer text-slate-600 font-bold whitespace-nowrap" onClick={handleCopy}>📋 コピーを作成</button>}
        {isAdmin && <button className="py-2.5 px-4 text-[15px] border border-red-300 rounded-lg bg-red-50 cursor-pointer text-red-600 font-bold whitespace-nowrap" onClick={handleDelete}>🗑 削除する</button>}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-6 bg-white/15 border-none rounded-full w-10 h-10 text-lg text-white cursor-pointer z-[1001]" onClick={() => setLightbox(null)}>✕</button>
          <img
            src={lightbox}
            alt="原寸表示"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* ── 基本情報 ── */}
        <div className="bg-white border border-slate-200 rounded-[14px] p-6 px-7">
          <h2 className="m-0 mb-5 text-[17px] font-bold text-slate-800 border-b-2 border-slate-200 pb-2.5">基本情報</h2>

          <Field label="資産名" required>
            <div className="flex gap-2.5 items-stretch">
              <input className={`${inputClass} flex-1`} value={form.name} onChange={(e) => set("name", e.target.value)} readOnly={!isAdmin} />
              {isAdmin && (
                <button type="button" className="px-4 text-sm font-bold border-none rounded-lg bg-teal-700 text-white cursor-pointer whitespace-nowrap" onClick={handleSearch} disabled={searching}>
                  {searching ? "検索中..." : "🔍 情報を自動入力"}
                </button>
              )}
            </div>
            {searchMsg && (
              <div className={`mt-1.5 text-[13px] font-semibold ${isSearchError ? "text-red-600" : "text-green-600"}`}>
                {searchMsg}
              </div>
            )}
          </Field>

          <Field label="種類" required>
            <div className="flex gap-6">
              {category.map((o) => (
                <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={o.value} checked={form.asset_category === o.value} onChange={() => set("asset_category", o.value as FormState["asset_category"])} disabled={!isAdmin} />
                  <span className="text-[15px] text-slate-700">{o.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="ハード">
            <select className={selectClass} value={form.hardware} onChange={(e) => set("hardware", e.target.value)} disabled={!isAdmin}>
              <option value="">選択してください</option>
              {hardware.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="ゲームメーカー">
            <input className={inputClass} value={form.maker} onChange={(e) => set("maker", e.target.value)} placeholder="例: カプコン、任天堂、セガ" readOnly={!isAdmin} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="ジャンル">
              <select className={selectClass} value={form.genre} onChange={(e) => set("genre", e.target.value)} disabled={!isAdmin}>
                <option value="">選択してください</option>
                {genre.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="エディション">
              <select className={selectClass} value={form.edition} onChange={(e) => set("edition", e.target.value)} disabled={!isAdmin}>
                <option value="">選択してください</option>
                {edition.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="公式サイト URL">
            <input className={inputClass} type="url" value={form.official_url} onChange={(e) => set("official_url", e.target.value)} placeholder="https://..." readOnly={!isAdmin} />
          </Field>

          <Field label="販売年">
            <input className={inputClass} value={form.release_year} onChange={(e) => set("release_year", e.target.value)} placeholder="例: 1992" maxLength={10} readOnly={!isAdmin} />
          </Field>

          <Field label="状態">
            <select className={selectClass} value={form.condition} onChange={(e) => set("condition", e.target.value)} disabled={!isAdmin}>
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
              readOnly={!isAdmin}
            />
          </Field>

          <Field label="タグ" hint="カンマ区切りで複数入力できます">
            <input className={inputClass} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="格闘, カプコン, 名作" readOnly={!isAdmin} />
          </Field>

          <Field label="説明">
            <textarea className="w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg resize-y box-border" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} readOnly={!isAdmin} />
          </Field>
        </div>

        {/* ── 写真 ── */}
        <div className="bg-white border border-slate-200 rounded-[14px] p-6 px-7">
          <h2 className="m-0 mb-5 text-[17px] font-bold text-slate-800 border-b-2 border-slate-200 pb-2.5 flex items-center gap-2.5">
            写真
            <span className="text-[13px] font-semibold text-slate-500 bg-slate-100 py-0.5 px-2.5 rounded-full">{allPhotoCount}枚</span>
          </h2>

          {visiblePhotos.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {visiblePhotos.map((photo, idx) => (
                <div key={photo.id} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5">
                  <div className="w-[72px] text-center shrink-0">
                    {idx === 0
                      ? <span className="bg-blue-600 text-white text-[11px] font-bold py-0.5 px-2 rounded-full">サムネイル</span>
                      : <span className="text-sm text-slate-500 font-semibold">{idx + 1}</span>}
                  </div>

                  <div className="w-[70px] h-[70px] rounded-md overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 cursor-zoom-in" onClick={() => setLightbox(photo.url)} title="クリックで原寸表示">
                    <img
                      src={photo.thumb_url || photo.url}
                      alt={photo.file_name}
                      className="w-[70px] h-[70px] object-cover transition-transform duration-[250ms]"
                      style={{ transform: `rotate(${photo.rotation}deg)` }}
                      onError={(e) => { (e.target as HTMLImageElement).src = photo.url; }}
                    />
                  </div>

                  <span className="flex-1 text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">{photo.file_name}</span>
                  {photo.rotation !== 0 && (
                    <span className="text-[11px] text-amber-400 font-bold bg-yellow-50 py-0.5 px-2 rounded-full shrink-0">{photo.rotation}°(保存時に適用)</span>
                  )}

                  {isAdmin && (
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" className="w-[34px] h-[34px] border border-blue-200 rounded-md bg-blue-50 cursor-pointer text-base text-blue-600 font-bold" onClick={() => rotatePending(photo.id, -90)} title="左90°">↺</button>
                      <button type="button" className="w-[34px] h-[34px] border border-blue-200 rounded-md bg-blue-50 cursor-pointer text-base text-blue-600 font-bold" onClick={() => rotatePending(photo.id, 90)} title="右90°">↻</button>
                      <button type="button" className="w-[34px] h-[34px] border border-slate-200 rounded-md bg-white cursor-pointer text-[13px] text-slate-600 disabled:opacity-40" onClick={() => moveExisting(idx, -1)} disabled={idx === 0} title="上へ">▲</button>
                      <button type="button" className="w-[34px] h-[34px] border border-slate-200 rounded-md bg-white cursor-pointer text-[13px] text-slate-600 disabled:opacity-40" onClick={() => moveExisting(idx, 1)} disabled={idx === visiblePhotos.length - 1} title="下へ">▼</button>
                      <button type="button" className="w-[34px] h-[34px] border-none rounded-md bg-red-100 cursor-pointer text-sm text-red-600" onClick={() => markDeleted(photo.id)} title="削除">✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className={visiblePhotos.length > 0 ? "mt-[18px]" : ""}>
              {newPhotos.length > 0 && (
                <div className="text-[13px] font-bold text-amber-400 bg-amber-50 border border-amber-200 rounded-md py-1.5 px-3 mb-2.5">追加する写真（未保存）</div>
              )}
              <PhotoUpload photos={newPhotos} onChange={setNewPhotos} />
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 px-[18px] text-red-600 text-[15px]">{error}</div>}

        <div className="flex gap-3 justify-end pb-10">
          <button type="button" className="py-3.5 px-7 text-base border border-slate-200 rounded-xl bg-slate-50 cursor-pointer text-slate-500" onClick={() => navigate("/")}>← 一覧に戻る</button>
          {isAdmin && (
            <button type="submit" className="py-3.5 px-9 text-base font-bold border-none rounded-xl bg-blue-600 text-white cursor-pointer disabled:opacity-60" disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </button>
          )}
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
