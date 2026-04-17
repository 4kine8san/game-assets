import type { CSSProperties } from "react";
import type { AssetFilters } from "../types/asset";
import { SORT_OPTIONS } from "../types/asset";
import { useMasters } from "../contexts/MastersContext";

interface Props {
  filters: AssetFilters;
  onChange: (f: AssetFilters) => void;
}

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
    <div style={styles.wrap}>
      <input
        style={styles.input}
        type="text"
        placeholder="タイトル・タグ・説明で検索..."
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
      />

      <select style={styles.sel} value={filters.asset_category} onChange={(e) => set("asset_category", e.target.value)}>
        <option value="">すべての種類</option>
        {category.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select style={styles.sel} value={filters.hardware} onChange={(e) => set("hardware", e.target.value)}>
        <option value="">すべてのハード</option>
        {hardware.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select style={styles.sel} value={filters.genre} onChange={(e) => set("genre", e.target.value)}>
        <option value="">すべてのジャンル</option>
        {genre.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select style={styles.sel} value={sortValue} onChange={(e) => handleSort(e.target.value)}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilter && (
        <button style={styles.clear} onClick={() => onChange({ search: "", asset_category: "", hardware: "", genre: "", sort_by: filters.sort_by, sort_dir: filters.sort_dir })}>
          条件をクリア
        </button>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", padding: "14px 0" },
  input: {
    flex: "1 1 260px", padding: "11px 14px", fontSize: "15px",
    border: "1px solid #cbd5e1", borderRadius: "8px",
  },
  sel: {
    padding: "11px 14px", fontSize: "15px", border: "1px solid #cbd5e1",
    borderRadius: "8px", background: "#fff", cursor: "pointer", minWidth: "160px",
  },
  clear: {
    padding: "11px 16px", fontSize: "14px", border: "1px solid #e2e8f0",
    borderRadius: "8px", background: "#f8fafc", cursor: "pointer", color: "#64748b",
    whiteSpace: "nowrap",
  },
};
