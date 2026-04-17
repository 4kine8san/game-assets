import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
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

  useEffect(() => { load(xAxis, yAxis); }, [xAxis, yAxis, load]);

  const isYen = yAxis !== "count";
  const total = result?.items.reduce((s, i) => s + i.value, 0) ?? 0;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>← 一覧に戻る</button>
        <h1 style={styles.title}>集計</h1>
      </div>

      {/* コントロール */}
      <div style={styles.controls}>
        <div style={styles.controlItem}>
          <label style={styles.ctrlLabel}>X軸（分類）</label>
          <select style={styles.sel} value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
            {X_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={styles.controlItem}>
          <label style={styles.ctrlLabel}>Y軸（値）</label>
          <select style={styles.sel} value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
            {Y_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {result && (
          <div style={styles.summary}>
            合計: <strong>{isYen ? `¥${total.toLocaleString()}` : `${total}件`}</strong>
            　／　{result.items.length} カテゴリ
          </div>
        )}
      </div>

      {/* グラフ */}
      <div style={styles.chartCard}>
        {loading ? (
          <div style={styles.center}>読み込み中...</div>
        ) : error ? (
          <div style={styles.errMsg}>{error}</div>
        ) : !result || result.items.length === 0 ? (
          <div style={styles.center}>データがありません</div>
        ) : (
          <>
            <div style={styles.chartTitle}>
              {result.x_label}別　{result.y_label}
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={result.items} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 13, fill: "#374151" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 13, fill: "#374151" }}
                  tickFormatter={isYen ? (v: number) => `¥${v.toLocaleString()}` : undefined}
                />
                <Tooltip
                  formatter={(v: number) => isYen ? `¥${v.toLocaleString()}` : `${v}件`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #bbf7d0" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {result.items.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* 明細テーブル */}
      {result && result.items.length > 0 && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{result.x_label}</th>
                <th style={{ ...styles.th, textAlign: "right" }}>{result.y_label}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item, i) => (
                <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                  <td style={styles.td}>{item.label}</td>
                  <td style={{ ...styles.td, textAlign: "right", fontWeight: 700 }}>
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

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: "960px", margin: "0 auto", padding: "28px 24px", background: "#f0fdf4", minHeight: "100vh" },
  topBar: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" },
  backBtn: { padding: "9px 18px", fontSize: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" },
  title: { margin: 0, fontSize: "24px", fontWeight: 800, color: "#0f172a" },
  controls: { display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px" },
  controlItem: { display: "flex", flexDirection: "column", gap: "6px" },
  ctrlLabel: { fontSize: "13px", fontWeight: 700, color: "#334155" },
  sel: { padding: "10px 14px", fontSize: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", minWidth: "180px" },
  summary: { marginLeft: "auto", fontSize: "15px", color: "#475569", alignSelf: "center" },
  chartCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px 20px", marginBottom: "20px", minHeight: "200px" },
  chartTitle: { fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "16px", textAlign: "center" },
  center: { textAlign: "center", padding: "60px", fontSize: "16px", color: "#64748b" },
  errMsg: { textAlign: "center", padding: "60px", fontSize: "15px", color: "#dc2626" },
  tableCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginBottom: "40px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 18px", fontSize: "13px", fontWeight: 700, color: "#475569", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" },
  td: { padding: "11px 18px", fontSize: "15px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" },
  trEven: { background: "#fafafa" },
};
