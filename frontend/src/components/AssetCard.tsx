import type { CSSProperties } from "react";
import type { Asset } from "../types/asset";
import { useMasters } from "../contexts/MastersContext";
import { API_BASE_URL } from "../config";

export type ViewMode = "large" | "medium" | "small" | "grid";

interface Props {
  asset: Asset;
  onClick: (id: number) => void;
  viewMode?: ViewMode;
}

function findLabel(opts: { value: string; label: string }[], val?: string) {
  return opts.find((o) => o.value === val)?.label ?? val ?? "";
}

const CATEGORY_LABEL: Record<string, string> = {
  arcade: "アーケード", hardware: "ハード", other: "その他", consumer: "家庭用",
};
const CATEGORY_COLOR: Record<string, string> = {
  arcade: "#dc2626", hardware: "#0891b2", other: "#7c3aed", consumer: "#2563eb",
};

export default function AssetCard({ asset, onClick, viewMode = "medium" }: Props) {
  const { hardware: hwOptions, genre: genreOptions, edition: editionOptions, condition: conditionOptions } = useMasters();
  const tags = asset.tags ? asset.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const hw = findLabel(hwOptions, asset.hardware);
  const genre = findLabel(genreOptions, asset.genre);
  const editionLabel = findLabel(editionOptions, asset.edition);
  const conditionLabel = findLabel(conditionOptions, asset.condition);
  const catColor = CATEGORY_COLOR[asset.asset_category] ?? "#2563eb";
  const catLabel = CATEGORY_LABEL[asset.asset_category] ?? asset.asset_category;
  const thumbSrc = asset.thumbnail_url ? `${API_BASE_URL}${asset.thumbnail_url}` : null;

  // ── グリッド形式（テーブル行）──────────────────────────────────────────────
  // 表示項目: サムネイル、資産名、ハード、状態、資産評価額
  if (viewMode === "grid") {
    return (
      <div style={gridStyles.row} onClick={() => onClick(asset.id)}>
        <div style={gridStyles.thumb}>
          {thumbSrc
            ? <img src={thumbSrc} alt={asset.name} style={gridStyles.img} />
            : <span style={{ fontSize: "24px" }}>🎮</span>}
        </div>
        <div style={gridStyles.name} title={asset.name}>{asset.name}</div>
        <div style={gridStyles.cell}>
          <span style={{ ...gridStyles.catPill, background: catColor }}>{catLabel}</span>
        </div>
        <div style={gridStyles.cell}>
          {hw ? <span style={gridStyles.hwPill}>{hw}</span> : <span style={gridStyles.empty}>-</span>}
        </div>
        <div style={gridStyles.cell}>
          {genre ? <span style={gridStyles.genrePill}>{genre}</span> : <span style={gridStyles.empty}>-</span>}
        </div>
        <div style={gridStyles.cell}>
          {editionLabel ? <span style={gridStyles.editionText}>{editionLabel}</span> : <span style={gridStyles.empty}>-</span>}
        </div>
        <div style={gridStyles.cell}>
          {conditionLabel
            ? <span style={gridStyles.condPill}>{conditionLabel}</span>
            : <span style={gridStyles.empty}>-</span>}
        </div>
        <div style={gridStyles.valueCell}>
          {asset.asset_value != null
            ? <span style={gridStyles.value}>¥{asset.asset_value.toLocaleString()}</span>
            : <span style={gridStyles.empty}>-</span>}
        </div>
        <div style={gridStyles.hint}>›</div>
      </div>
    );
  }

  // ── アイコン形式（大 / 中 / 小）────────────────────────────────────────────
  const thumbH = viewMode === "large" ? 210 : viewMode === "medium" ? 150 : 100;
  const nameSize = viewMode === "large" ? "16px" : viewMode === "medium" ? "14px" : "12px";

  return (
    <div style={cardStyles.card} onClick={() => onClick(asset.id)}>
      <div style={{ ...cardStyles.thumb, height: `${thumbH}px` }}>
        {thumbSrc
          ? <img src={thumbSrc} alt={asset.name} style={cardStyles.img} />
          : <span style={{ fontSize: viewMode === "large" ? "60px" : viewMode === "medium" ? "44px" : "30px" }}>🎮</span>}
        <span style={{ ...cardStyles.catBadge, background: catColor, fontSize: viewMode === "small" ? "10px" : "11px" }}>
          {catLabel}
        </span>
      </div>

      <div style={cardStyles.body}>
        <div style={{ ...cardStyles.name, fontSize: nameSize }} title={asset.name}>{asset.name}</div>

        {viewMode !== "small" && asset.maker && (
          <div style={cardStyles.maker}>{asset.maker}</div>
        )}

        <div style={cardStyles.pills}>
          {hw && <span style={cardStyles.hw}>{hw}</span>}
          {viewMode !== "small" && genre && <span style={cardStyles.genre}>{genre}</span>}
        </div>

        {viewMode === "large" && conditionLabel && (
          <div style={cardStyles.condition}>{conditionLabel}</div>
        )}

        {viewMode !== "small" && asset.release_year && (
          <div style={cardStyles.year}>{asset.release_year}年</div>
        )}

        {viewMode === "large" && editionLabel && (
          <div style={cardStyles.edition}>{editionLabel}</div>
        )}

        {viewMode === "large" && tags.length > 0 && (
          <div style={cardStyles.tags}>
            {tags.slice(0, 3).map((t) => <span key={t} style={cardStyles.tag}>{t}</span>)}
            {tags.length > 3 && <span style={cardStyles.moreTag}>+{tags.length - 3}</span>}
          </div>
        )}
      </div>

      {viewMode !== "small" && (
        <div style={cardStyles.editHint}>タップして編集 ›</div>
      )}
    </div>
  );
}

// ── グリッド行スタイル ─────────────────────────────────────────────────────────

const gridStyles: Record<string, CSSProperties> = {
  row: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 75px 110px 100px 90px 80px 95px 24px",
    alignItems: "center",
    gap: "10px",
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px",
    padding: "8px 14px", cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  thumb: {
    width: "56px", height: "56px", borderRadius: "6px", flexShrink: 0,
    background: "#f1f5f9", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  name: { fontSize: "14px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cell: { display: "flex", alignItems: "center", overflow: "hidden" },
  catPill: { color: "#fff", fontSize: "11px", padding: "2px 7px", borderRadius: "999px", fontWeight: 700, whiteSpace: "nowrap" },
  hwPill: { background: "#e0f2fe", color: "#0369a1", fontSize: "12px", padding: "2px 8px", borderRadius: "999px", fontWeight: 600, whiteSpace: "nowrap" },
  genrePill: { background: "#f0fdf4", color: "#166534", fontSize: "11px", padding: "2px 7px", borderRadius: "999px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" },
  editionText: { fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" },
  condPill: { background: "#fef3c7", color: "#92400e", fontSize: "12px", padding: "2px 8px", borderRadius: "999px", fontWeight: 600, whiteSpace: "nowrap" },
  valueCell: { display: "flex", alignItems: "center", justifyContent: "flex-end" },
  value: { fontSize: "13px", fontWeight: 700, color: "#0f766e" },
  empty: { fontSize: "13px", color: "#94a3b8" },
  hint: { fontSize: "18px", color: "#94a3b8", textAlign: "center" },
};

// ── アイコン形式スタイル ───────────────────────────────────────────────────────

const cardStyles: Record<string, CSSProperties> = {
  card: {
    position: "relative", background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: "12px", overflow: "hidden", cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column",
  },
  thumb: {
    position: "relative", width: "100%",
    background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  catBadge: {
    position: "absolute", top: "8px", left: "8px",
    color: "#fff", fontWeight: 700, padding: "3px 10px", borderRadius: "999px",
  },
  body: { padding: "10px 12px", flex: 1 },
  name: { fontWeight: 700, color: "#1e293b", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  maker: { fontSize: "12px", color: "#64748b", marginBottom: "5px" },
  pills: { display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "4px" },
  hw: { background: "#e0f2fe", color: "#0369a1", fontSize: "11px", padding: "2px 7px", borderRadius: "999px", fontWeight: 600 },
  genre: { background: "#f0fdf4", color: "#166534", fontSize: "11px", padding: "2px 7px", borderRadius: "999px" },
  condition: { fontSize: "12px", color: "#92400e", background: "#fef3c7", padding: "2px 8px", borderRadius: "999px", display: "inline-block", marginBottom: "4px" },
  year: { fontSize: "12px", color: "#64748b", marginBottom: "4px" },
  edition: { fontSize: "12px", color: "#64748b", marginBottom: "4px" },
  tags: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" },
  tag: { background: "#fef9c3", color: "#854d0e", fontSize: "11px", padding: "2px 6px", borderRadius: "4px" },
  moreTag: { background: "#f1f5f9", color: "#64748b", fontSize: "11px", padding: "2px 6px", borderRadius: "4px" },
  editHint: {
    padding: "7px 12px", fontSize: "11px", color: "#94a3b8",
    borderTop: "1px solid #f1f5f9", textAlign: "right", background: "#fafafa",
  },
};
