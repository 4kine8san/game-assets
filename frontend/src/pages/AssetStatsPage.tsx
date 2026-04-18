import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { fetchStats } from "../api/stats";
import type { StatsResponse } from "../api/stats";

const X_OPTIONS = [
  { value: "hardware", label: "ハード" },
  { value: "genre", label: "ジャンル" },
  { value: "asset_category", label: "種類" },
  { value: "edition", label: "エディション" },
  { value: "release_year", label: "販売年" },
];

const Y_OPTIONS = [
  { value: "count", label: "資産数" },
  { value: "total_value", label: "合計評価額（円）" },
  { value: "avg_value", label: "平均評価額（円）" },
];

const BAR_COLORS = [
  "#16a34a", "#22c55e", "#4ade80", "#86efac", "#0d9488",
  "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#ea580c",
];

export default function AssetStatsPage() {
  const navigate = useNavigate();
  const [xAxis, setXAxis] = useState("hardware");
  const [yAxis, setYAxis] = useState("count");
  const [result, setResult] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (x: string, y: string) => {
    setLoading(true);
    setError("");
    try {
      setResult(await fetchStats(x, y));
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(xAxis, yAxis); }, [xAxis, yAxis, load]);

  const isYen = yAxis !== "count";
  const total = result?.items.reduce((s, i) => s + i.value, 0) ?? 0;

  return (
    <div className="max-w-[960px] mx-auto px-6 py-7 min-h-screen">
      <div className="flex items-center gap-3.5 mb-5">
        <button className="py-2.5 px-4 text-[15px] border border-slate-200 rounded-lg bg-white cursor-pointer text-slate-600 whitespace-nowrap" onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1 className="m-0 text-2xl font-extrabold text-slate-900">集計</h1>
      </div>

      <div className="flex gap-4 flex-wrap items-end bg-white border border-slate-200 rounded-xl p-[18px_20px] mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-700">X軸（分類）</label>
          <select className="py-2.5 px-3.5 text-[15px] border border-slate-300 rounded-lg bg-white min-w-[180px]" value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
            {X_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-slate-700">Y軸（値）</label>
          <select className="py-2.5 px-3.5 text-[15px] border border-slate-300 rounded-lg bg-white min-w-[180px]" value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
            {Y_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {result && (
          <div className="ml-auto text-[15px] text-slate-600 self-center">
            合計: <strong>{isYen ? `¥${total.toLocaleString()}` : `${total}件`}</strong>
             / {result.items.length} カテゴリ
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[14px] p-6 px-5 mb-5 min-h-[200px]">
        {loading ? (
          <div className="text-center p-[60px] text-base text-slate-500">読み込み中...</div>
        ) : error ? (
          <div className="text-center p-[60px] text-[15px] text-red-600">{error}</div>
        ) : !result || result.items.length === 0 ? (
          <div className="text-center p-[60px] text-base text-slate-500">データがありません</div>
        ) : (
          <>
            <div className="text-base font-bold text-slate-800 mb-4 text-center">
              {result.x_label}別 {result.y_label}
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={result.items} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="label" tick={{ fontSize: 13, fill: "#374151" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 13, fill: "#374151" }} tickFormatter={isYen ? (v: number) => `¥${v.toLocaleString()}` : undefined} />
                <Tooltip
                  formatter={(v) => { const n = typeof v === "number" ? v : 0; return isYen ? `¥${n.toLocaleString()}` : `${n}件`; }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #bbf7d0" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {result.items.map((item, i) => (
                    <Cell key={item.label} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {result && result.items.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden mb-10">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-3 px-[18px] text-[13px] font-bold text-slate-600 bg-slate-50 border-b-2 border-slate-200 text-left">{result.x_label}</th>
                <th className="py-3 px-[18px] text-[13px] font-bold text-slate-600 bg-slate-50 border-b-2 border-slate-200 text-right">{result.y_label}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item, i) => (
                <tr key={item.label} className={i % 2 === 0 ? "bg-[#fafafa]" : ""}>
                  <td className="py-[11px] px-[18px] text-[15px] text-slate-800 border-b border-slate-100">{item.label}</td>
                  <td className="py-[11px] px-[18px] text-[15px] text-slate-800 border-b border-slate-100 text-right font-bold">
                    {isYen ? `¥${item.value.toLocaleString()}` : `${item.value}件`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
