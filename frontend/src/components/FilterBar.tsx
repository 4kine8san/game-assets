import type { AssetFilters } from "../types/asset";
import { SORT_OPTIONS } from "../types/asset";
import { useMasters } from "../contexts/MastersContext";

interface Props {
  filters: AssetFilters;
  onChange: (f: AssetFilters) => void;
}

const selClass = "py-[11px] px-3.5 text-[15px] border border-slate-300 rounded-lg bg-white cursor-pointer min-w-[160px]";

export default function FilterBar({ filters, onChange }: Props) {
  const { category, hardware, genre } = useMasters();
  const set = (key: keyof AssetFilters, val: string) => onChange({ ...filters, [key]: val });

  const sortValue = `${filters.sort_by}|${filters.sort_dir}`;
  const handleSort = (v: string) => {
    const [sort_by, sort_dir] = v.split("|");
    onChange({ ...filters, sort_by, sort_dir });
  };

  const hasFilter = !!(filters.search || filters.asset_category || filters.hardware || filters.genre);

  return (
    <div className="flex gap-2.5 flex-wrap items-center py-3.5">
      <input
        className="flex-1 basis-[260px] py-[11px] px-3.5 text-[15px] border border-slate-300 rounded-lg"
        type="text"
        placeholder="タイトル・タグ・説明で検索..."
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
      />

      <select className={selClass} value={filters.asset_category} onChange={(e) => set("asset_category", e.target.value)}>
        <option value="">すべての種類</option>
        {category.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className={selClass} value={filters.hardware} onChange={(e) => set("hardware", e.target.value)}>
        <option value="">すべてのハード</option>
        {hardware.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className={selClass} value={filters.genre} onChange={(e) => set("genre", e.target.value)}>
        <option value="">すべてのジャンル</option>
        {genre.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className={selClass} value={sortValue} onChange={(e) => handleSort(e.target.value)}>
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {hasFilter && (
        <button
          className="py-[11px] px-4 text-sm border border-slate-200 rounded-lg bg-slate-50 cursor-pointer text-slate-500 whitespace-nowrap"
          onClick={() => onChange({ search: "", asset_category: "", hardware: "", genre: "", sort_by: filters.sort_by, sort_dir: filters.sort_dir })}
        >
          条件をクリア
        </button>
      )}
    </div>
  );
}
