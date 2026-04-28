import type { Asset } from "../types/asset";
import { useMasters } from "../contexts/MastersContext";
import { API_BASE_URL } from "../config";
import { CATEGORY_LABEL } from "../constants/labels";

export type ViewMode = "large" | "medium" | "small" | "grid";

interface Props {
  asset: Asset;
  onClick: (id: number) => void;
  viewMode?: ViewMode;
  isAdmin?: boolean;
}

function findLabel(opts: { value: string; label: string }[], val?: string) {
  return opts.find((o) => o.value === val)?.label ?? val ?? "";
}


const CATEGORY_COLOR: Record<string, string> = {
  arcade: "#dc2626", hardware: "#0891b2", other: "#7c3aed", consumer: "#2563eb",
};

export default function AssetCard({ asset, onClick, viewMode = "medium", isAdmin = false }: Props) {
  const { hardware: hwOptions, genre: genreOptions, edition: editionOptions, condition: conditionOptions } = useMasters();
  const tags = asset.tags ? asset.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const hw = findLabel(hwOptions, asset.hardware);
  const genre = findLabel(genreOptions, asset.genre);
  const editionLabel = findLabel(editionOptions, asset.edition);
  const conditionLabel = findLabel(conditionOptions, asset.condition);
  const catColor = CATEGORY_COLOR[asset.asset_category] ?? "#2563eb";
  const catLabel = CATEGORY_LABEL[asset.asset_category] ?? asset.asset_category;
  const thumbSrc = asset.thumbnail_url ? `${API_BASE_URL}${asset.thumbnail_url}` : null;

  // ── グリッド形式 ──────────────────────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <div
        className="grid items-center gap-2.5 bg-white border border-slate-200 rounded-xl py-2 px-3.5 shadow-sm cursor-pointer"
        style={{ gridTemplateColumns: "56px 1fr 75px 110px 100px 90px 80px 95px 24px" }}
        onClick={() => onClick(asset.id)}
      >
        <div className="w-[56px] h-[56px] rounded-md shrink-0 bg-slate-100 overflow-hidden flex items-center justify-center">
          {thumbSrc
            ? <img src={thumbSrc} alt={asset.name} className="w-full h-full object-cover" />
            : <span className="text-2xl">🎮</span>}
        </div>
        <div className="text-sm font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis" title={asset.name}>{asset.name}</div>
        <div className="flex items-center overflow-hidden">
          <span className="text-white text-[11px] py-0.5 px-[7px] rounded-full font-bold whitespace-nowrap" style={{ background: catColor }}>{catLabel}</span>
        </div>
        <div className="flex items-center overflow-hidden">
          {hw ? <span className="bg-sky-100 text-sky-700 text-xs py-0.5 px-2 rounded-full font-semibold whitespace-nowrap">{hw}</span> : <span className="text-[13px] text-slate-400">-</span>}
        </div>
        <div className="flex items-center overflow-hidden">
          {genre ? <span className="bg-green-50 text-green-800 text-[11px] py-0.5 px-[7px] rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{genre}</span> : <span className="text-[13px] text-slate-400">-</span>}
        </div>
        <div className="flex items-center overflow-hidden">
          {editionLabel ? <span className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{editionLabel}</span> : <span className="text-[13px] text-slate-400">-</span>}
        </div>
        <div className="flex items-center overflow-hidden">
          {conditionLabel
            ? <span className="bg-amber-100 text-amber-800 text-xs py-0.5 px-2 rounded-full font-semibold whitespace-nowrap">{conditionLabel}</span>
            : <span className="text-[13px] text-slate-400">-</span>}
        </div>
        <div className="flex items-center justify-end">
          {asset.asset_value != null
            ? <span className="text-[13px] font-bold text-teal-700">¥{asset.asset_value.toLocaleString()}</span>
            : <span className="text-[13px] text-slate-400">-</span>}
        </div>
        <div className="text-lg text-slate-400 text-center">›</div>
      </div>
    );
  }

  // ── アイコン形式 ──────────────────────────────────────────────────────────────
  const thumbH = viewMode === "large" ? 210 : viewMode === "medium" ? 150 : 100;
  const nameSize = viewMode === "large" ? "16px" : viewMode === "medium" ? "14px" : "12px";

  return (
    <div
      className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col cursor-pointer"
      onClick={() => onClick(asset.id)}
    >
      <div className="relative w-full bg-slate-100 flex items-center justify-center overflow-hidden" style={{ height: `${thumbH}px` }}>
        {thumbSrc
          ? <img src={thumbSrc} alt={asset.name} className="w-full h-full object-cover" />
          : <span style={{ fontSize: viewMode === "large" ? "60px" : viewMode === "medium" ? "44px" : "30px" }}>🎮</span>}
        <span
          className="absolute top-2 left-2 text-white font-bold py-0.5 px-2.5 rounded-full"
          style={{ background: catColor, fontSize: viewMode === "small" ? "10px" : "11px" }}
        >
          {catLabel}
        </span>
      </div>

      <div className="p-2.5 px-3 flex-1">
        <div className="font-bold text-slate-800 mb-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: nameSize }} title={asset.name}>{asset.name}</div>

        {viewMode !== "small" && asset.maker && (
          <div className="text-xs text-slate-500 mb-1.5">{asset.maker}</div>
        )}

        <div className="flex gap-1.5 flex-wrap mb-1">
          {hw && <span className="bg-sky-100 text-sky-700 text-[11px] py-0.5 px-[7px] rounded-full font-semibold">{hw}</span>}
          {viewMode !== "small" && genre && <span className="bg-green-50 text-green-800 text-[11px] py-0.5 px-[7px] rounded-full">{genre}</span>}
        </div>

        {viewMode === "large" && conditionLabel && (
          <div className="text-xs text-amber-800 bg-amber-100 py-0.5 px-2 rounded-full inline-block mb-1">{conditionLabel}</div>
        )}

        {viewMode !== "small" && asset.release_year && (
          <div className="text-xs text-slate-500 mb-1">{asset.release_year}年</div>
        )}

        {viewMode === "large" && editionLabel && (
          <div className="text-xs text-slate-500 mb-1">{editionLabel}</div>
        )}

        {viewMode === "large" && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 3).map((t) => <span key={t} className="bg-yellow-100 text-yellow-800 text-[11px] py-0.5 px-1.5 rounded">{t}</span>)}
            {tags.length > 3 && <span className="bg-slate-100 text-slate-500 text-[11px] py-0.5 px-1.5 rounded">+{tags.length - 3}</span>}
          </div>
        )}
      </div>

      {viewMode !== "small" && (
        <div className="py-[7px] px-3 text-[11px] text-slate-400 border-t border-slate-100 text-right bg-[#fafafa]">
          {isAdmin ? "タップして編集 ›" : "タップして詳細 ›"}
        </div>
      )}
    </div>
  );
}
