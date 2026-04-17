import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets, downloadAssets } from "../api/assets";
import type { Asset, AssetListResponse, AssetFilters } from "../types/asset";
import AssetCard from "../components/AssetCard";
import type { ViewMode } from "../components/AssetCard";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";

const LIMIT = 50;
const INIT_FILTERS: AssetFilters = { search: "", asset_category: "", hardware: "", genre: "", sort_by: "name", sort_dir: "asc" };

const VIEW_OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: "large", label: "大" },
  { mode: "medium", label: "中" },
  { mode: "small", label: "小" },
  { mode: "grid", label: "グリッド" },
];

const GRID_COLS: Record<ViewMode, string> = {
  large: "repeat(auto-fill, minmax(260px, 1fr))",
  medium: "repeat(auto-fill, minmax(200px, 1fr))",
  small: "repeat(auto-fill, minmax(140px, 1fr))",
  grid: "1fr",
};

export default function AssetListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AssetListResponse | null>(null);
  const [filters, setFilters] = useState<AssetFilters>(INIT_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("medium");
  const [dlFormat, setDlFormat] = useState<"csv" | "json">("csv");
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: AssetFilters, p: number) => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetchAssets({
        page: p, limit: LIMIT,
        search: f.search || undefined,
        asset_category: f.asset_category || undefined,
        hardware: f.hardware || undefined,
        genre: f.genre || undefined,
        sort_by: f.sort_by || "name",
        sort_dir: f.sort_dir || "asc",
      });
      setData(res);
    } catch {
      setLoadError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => load(filters, page), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [filters, page, load]);

  const handleFilterChange = (f: AssetFilters) => { setFilters(f); setPage(1); };

  const handleDownload = async () => {
    setDownloading(true);
    setDlError("");
    try {
      await downloadAssets(dlFormat, {
        search: filters.search || undefined,
        asset_category: filters.asset_category || undefined,
        hardware: filters.hardware || undefined,
        genre: filters.genre || undefined,
      });
    } catch {
      setDlError("ダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ゲーム資産管理</h1>
          <p style={styles.sub}>{data ? `全 ${data.total} 件` : "読み込み中..."}</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* ビュー切り替え */}
          <div style={styles.viewToggle}>
            {VIEW_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                style={{ ...styles.viewBtn, ...(viewMode === mode ? styles.viewBtnActive : {}) }}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          <button style={styles.statsBtn} onClick={() => navigate("/stats")}>📊 集計</button>

          <div style={styles.dlGroup}>
            <select style={styles.dlSelect} value={dlFormat} onChange={(e) => setDlFormat(e.target.value as "csv" | "json")}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button style={styles.dlBtn} onClick={handleDownload} disabled={downloading}>
              {downloading ? "処理中..." : "⬇ ダウンロード"}
            </button>
          </div>

          <button style={styles.addBtn} onClick={() => navigate("/register")}>＋ 資産を登録する</button>
        </div>
      </header>

      {dlError && <div style={styles.dlError}>{dlError}</div>}
      {loadError && <div style={styles.dlError}>{loadError}</div>}

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div style={styles.center}>読み込み中...</div>
      ) : data && data.items.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: "60px", marginBottom: "12px" }}>📂</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>資産が見つかりません</div>
          <div style={{ fontSize: "15px", color: "#94a3b8" }}>検索条件を変更するか、新しい資産を登録してください</div>
        </div>
      ) : (
        <>
          {viewMode === "grid" && (
            <div style={styles.gridHeader}>
              <div />
              <div>資産名</div>
              <div>種類</div>
              <div>ハード</div>
              <div>ジャンル</div>
              <div>エディション</div>
              <div>状態</div>
              <div style={{ textAlign: "right" }}>評価額</div>
              <div />
            </div>
          )}
          <div style={{ ...styles.grid, gridTemplateColumns: GRID_COLS[viewMode], gap: viewMode === "grid" ? "6px" : "16px" }}>
            {(data?.items ?? []).map((asset: Asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                viewMode={viewMode}
                onClick={(id) => navigate(`/assets/${id}/edit`)}
              />
            ))}
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.total_pages} total={data.total} limit={data.limit} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: "1400px", margin: "0 auto", padding: "28px 24px", background: "#f0fdf4", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px", flexWrap: "wrap", gap: "12px" },
  title: { margin: 0, fontSize: "26px", fontWeight: 800, color: "#0f172a" },
  sub: { margin: "4px 0 0", fontSize: "15px", color: "#64748b" },
  viewToggle: { display: "flex", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" },
  viewBtn: {
    padding: "10px 14px", fontSize: "13px", fontWeight: 600,
    border: "none", borderRight: "1px solid #e2e8f0", background: "#fff",
    cursor: "pointer", color: "#64748b", whiteSpace: "nowrap",
  } as CSSProperties,
  viewBtnActive: { background: "#0f766e", color: "#fff" },
  statsBtn: {
    padding: "12px 20px", fontSize: "16px", fontWeight: 700,
    background: "#fff", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer",
    whiteSpace: "nowrap",
  },
  addBtn: {
    padding: "12px 24px", fontSize: "16px", fontWeight: 700,
    background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer",
    whiteSpace: "nowrap",
  },
  grid: { display: "grid", gap: "8px" },
  gridHeader: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 75px 110px 100px 90px 80px 95px 24px",
    gap: "12px",
    padding: "6px 14px",
    fontSize: "12px", fontWeight: 700, color: "#64748b",
    borderBottom: "2px solid #e2e8f0", marginBottom: "4px",
  } as CSSProperties,
  center: { textAlign: "center", padding: "80px", fontSize: "16px", color: "#64748b" },
  empty: { textAlign: "center", padding: "80px 20px" },
  dlError: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 16px", color: "#dc2626", fontSize: "14px", marginTop: "8px" },
  dlGroup: { display: "flex", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" },
  dlSelect: { padding: "12px 10px", fontSize: "14px", border: "none", borderRight: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", color: "#374151" },
  dlBtn: { padding: "12px 16px", fontSize: "14px", fontWeight: 700, border: "none", background: "#fff", cursor: "pointer", color: "#374151", whiteSpace: "nowrap" },
};
