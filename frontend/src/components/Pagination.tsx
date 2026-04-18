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

  const btnBase = "py-2.5 px-[15px] text-[15px] border rounded-lg cursor-pointer";

  return (
    <div className="flex items-center justify-between py-5 flex-wrap gap-2.5">
      <span className="text-[15px] text-slate-500">{from}～{to} 件 / 全{total}件</span>
      <div className="flex gap-1.5 items-center">
        <button
          className={`${btnBase} border-slate-200 bg-white text-gray-700${page === 1 ? " opacity-40 cursor-not-allowed" : ""}`}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >‹ 前へ</button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`d${i}`} className="px-1 text-slate-400">…</span>
            : <button
                key={p}
                className={`${btnBase}${p === page ? " bg-blue-600 text-white border-blue-600 font-bold" : " bg-white border-slate-200 text-gray-700"}`}
                onClick={() => onPageChange(p as number)}
              >{p}</button>
        )}
        <button
          className={`${btnBase} border-slate-200 bg-white text-gray-700${page === totalPages ? " opacity-40 cursor-not-allowed" : ""}`}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >次へ ›</button>
      </div>
    </div>
  );
}
