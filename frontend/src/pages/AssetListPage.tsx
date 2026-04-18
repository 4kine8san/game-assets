import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets, downloadAssets } from "../api/assets";
import type { Asset, AssetListResponse, AssetFilters } from "../types/asset";
import AssetCard from "../components/AssetCard";
import type { ViewMode } from "../components/AssetCard";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import { useAdmin } from "../contexts/AdminContext";

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
  const { isAdmin, enterAdmin, exitAdmin } = useAdmin();
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [data, setData] = useState<AssetListResponse | null>(null);
  const [filters, setFilters] = useState<AssetFilters>(() => {
    try {
      const s = sessionStorage.getItem("assetListFilters");
      return s ? (JSON.parse(s) as AssetFilters) : INIT_FILTERS;
    } catch { return INIT_FILTERS; }
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (sessionStorage.getItem("assetListViewMode") as ViewMode) || "medium";
    } catch { return "medium"; }
  });
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

  useEffect(() => {
    sessionStorage.setItem("assetListFilters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem("assetListViewMode", viewMode);
  }, [viewMode]);

  const handleFilterChange = (f: AssetFilters) => { setFilters(f); setPage(1); };

  const handleAdminToggle = () => {
    if (isAdmin) {
      exitAdmin();
    } else {
      setPwInput("");
      setPwError("");
      setShowPwModal(true);
    }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    const error = await enterAdmin(pwInput);
    setPwLoading(false);
    if (error === null) {
      setShowPwModal(false);
      setPwInput("");
    } else {
      setPwError(error);
    }
  };

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
    <div className="max-w-[1400px] mx-auto px-6 py-7 min-h-screen">
      {showPwModal && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center" onClick={() => setShowPwModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-[400px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="m-0 mb-2 text-xl font-extrabold text-slate-900">管理者モードに切り替え</h2>
            <p className="m-0 mb-5 text-sm text-slate-500">管理者パスワードを入力してください</p>
            <form onSubmit={handlePwSubmit}>
              <input
                className="w-full py-3 px-3.5 text-[15px] border border-slate-300 rounded-lg mb-2.5"
                type="password"
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                placeholder="パスワード"
                autoFocus
              />
              {pwError && <div className="text-[13px] text-red-600 mb-2.5 font-semibold">{pwError}</div>}
              <div className="flex gap-2.5 justify-end mt-2">
                <button type="button" className="py-2.5 px-5 text-sm border border-slate-200 rounded-lg bg-slate-50 cursor-pointer text-slate-500" onClick={() => setShowPwModal(false)}>キャンセル</button>
                <button type="submit" className="py-2.5 px-6 text-sm font-bold rounded-lg bg-blue-600 text-white cursor-pointer disabled:opacity-50" disabled={pwLoading || !pwInput}>
                  {pwLoading ? "確認中..." : "切り替え"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex justify-between items-start mb-1 flex-wrap gap-3">
        <div>
          <h1 className="m-0 text-[26px] font-extrabold text-slate-900">ゲーム資産管理</h1>
          <p className="mt-1 m-0 text-[15px] text-slate-500">{data ? `全 ${data.total} 件` : "読み込み中..."}</p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            {VIEW_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                className={`px-3.5 py-2.5 text-[13px] font-semibold border-r border-slate-200 cursor-pointer whitespace-nowrap last:border-r-0${viewMode === mode ? " bg-teal-700 text-white" : " bg-white text-slate-500"}`}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="px-5 py-3 text-base font-bold bg-white text-gray-700 border border-slate-200 rounded-xl cursor-pointer whitespace-nowrap" onClick={() => navigate("/stats")}>📊 集計</button>

          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <select className="py-3 px-2.5 text-sm border-r border-slate-200 bg-slate-50 cursor-pointer text-gray-700" value={dlFormat} onChange={(e) => setDlFormat(e.target.value as "csv" | "json")}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button className="py-3 px-4 text-sm font-bold bg-white cursor-pointer text-gray-700 whitespace-nowrap" onClick={handleDownload} disabled={downloading}>
              {downloading ? "処理中..." : "⬇ ダウンロード"}
            </button>
          </div>

          {isAdmin && (
            <button className="px-6 py-3 text-base font-bold bg-blue-600 text-white rounded-xl cursor-pointer whitespace-nowrap" onClick={() => navigate("/register")}>＋ 資産を登録する</button>
          )}

          <button
            className={`px-5 py-3 text-sm font-bold border rounded-xl cursor-pointer whitespace-nowrap${isAdmin ? " bg-red-50 text-red-600 border-red-300" : " bg-white text-slate-500 border-slate-200"}`}
            onClick={handleAdminToggle}
          >
            {isAdmin ? "🔓 管理者モード中（終了）" : "🔒 管理者モード"}
          </button>
        </div>
      </header>

      {dlError && <div className="bg-red-50 border border-red-200 rounded-lg py-2.5 px-4 text-red-600 text-sm mt-2">{dlError}</div>}
      {loadError && <div className="bg-red-50 border border-red-200 rounded-lg py-2.5 px-4 text-red-600 text-sm mt-2">{loadError}</div>}

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="text-center p-20 text-base text-slate-500">読み込み中...</div>
      ) : data && data.items.length === 0 ? (
        <div className="text-center py-20 px-5">
          <div className="text-6xl mb-3">📂</div>
          <div className="text-lg font-bold text-slate-700 mb-2">資産が見つかりません</div>
          <div className="text-[15px] text-slate-400">検索条件を変更するか、新しい資産を登録してください</div>
        </div>
      ) : (
        <>
          {viewMode === "grid" && (
            <div
              className="grid gap-3 px-3.5 py-1.5 text-xs font-bold text-slate-500 border-b-2 border-slate-200 mb-1"
              style={{ gridTemplateColumns: "56px 1fr 75px 110px 100px 90px 80px 95px 24px" }}
            >
              <div />
              <div>資産名</div>
              <div>種類</div>
              <div>ハード</div>
              <div>ジャンル</div>
              <div>エディション</div>
              <div>状態</div>
              <div className="text-right">評価額</div>
              <div />
            </div>
          )}
          <div
            className="grid"
            style={{ gridTemplateColumns: GRID_COLS[viewMode], gap: viewMode === "grid" ? "6px" : "16px" }}
          >
            {(data?.items ?? []).map((asset: Asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                viewMode={viewMode}
                isAdmin={isAdmin}
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
