import type { CSSProperties } from "react";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div style={styles.wrap}>
      <span style={styles.info}>{from}～{to} 件 / 全{total}件</span>
      <div style={styles.btns}>
        <button style={{ ...styles.btn, ...(page === 1 ? styles.dis : {}) }} disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹ 前へ</button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`d${i}`} style={styles.dot}>…</span>
            : <button key={p} style={{ ...styles.btn, ...(p === page ? styles.active : {}) }} onClick={() => onPageChange(p as number)}>{p}</button>
        )}
        <button style={{ ...styles.btn, ...(page === totalPages ? styles.dis : {}) }} disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>次へ ›</button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: "10px" },
  info: { fontSize: "15px", color: "#64748b" },
  btns: { display: "flex", gap: "6px", alignItems: "center" },
  btn: { padding: "9px 15px", fontSize: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: "pointer", color: "#374151" },
  active: { background: "#2563eb", color: "#fff", borderColor: "#2563eb", fontWeight: 700 },
  dis: { opacity: 0.4, cursor: "not-allowed" },
  dot: { padding: "0 4px", color: "#94a3b8" },
};
