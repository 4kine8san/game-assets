import type { CSSProperties } from "react";
import type { Asset } from "../types/asset";
import { useMasters } from "../contexts/MastersContext";

interface Props {
  asset: Asset;
  onClick: (id: number) => void;
}

function findLabel(opts: { value: string; label: string }[], val?: string) {
  return opts.find((o) => o.value === val)?.label ?? val ?? "";
}

export default function AssetCard({ asset, onClick }: Props) {
  const { hardware: hwOptions, genre: genreOptions, edition: editionOptions } = useMasters();
  const tags = asset.tags ? asset.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const hw = findLabel(hwOptions, asset.hardware);
  const genre = findLabel(genreOptions, asset.genre);
  const editionLabel = findLabel(editionOptions, asset.edition);

  return (
    <div style={styles.card} onClick={() => onClick(asset.id)}>
      {/* サムネイル */}
      <div style={styles.thumb}>
        {asset.thumbnail_url ? (
          <img
            src={`http://localhost:8000${asset.thumbnail_url}`}
            alt={asset.name}
            style={styles.img}
          />
        ) : (
          <span style={styles.noImg}>🎮</span>
        )}
        <span style={{
          ...styles.catBadge,
          ...(asset.asset_category === "arcade" ? styles.arcadeBadge
            : asset.asset_category === "hardware" ? styles.hardwareBadge
            : asset.asset_category === "other" ? styles.otherBadge
            : {}),
        }}>
          {asset.asset_category === "arcade" ? "アーケード"
            : asset.asset_category === "hardware" ? "ハード"
            : asset.asset_category === "other" ? "その他"
            : "家庭用"}
        </span>
      </div>

      {/* 情報 */}
      <div style={styles.body}>
        <div style={styles.name} title={asset.name}>{asset.name}</div>

        {asset.maker && (
          <div style={styles.maker}>{asset.maker}</div>
        )}

        <div style={styles.pills}>
          {hw && <span style={styles.hw}>{hw}</span>}
          {genre && <span style={styles.genre}>{genre}</span>}
        </div>

        {asset.release_year && (
          <div style={styles.year}>{asset.release_year}年</div>
        )}

        {editionLabel && (
          <div style={styles.edition}>{editionLabel}</div>
        )}

        {tags.length > 0 && (
          <div style={styles.tags}>
            {tags.slice(0, 3).map((t) => <span key={t} style={styles.tag}>{t}</span>)}
            {tags.length > 3 && <span style={styles.moreTag}>+{tags.length - 3}</span>}
          </div>
        )}
      </div>

      {/* 編集へ */}
      <div style={styles.editHint}>タップして編集 ›</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    position: "relative", background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: "12px", overflow: "hidden", cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column",
    transition: "box-shadow 0.15s, transform 0.1s",
  },
  thumb: {
    position: "relative", width: "100%", height: "160px",
    background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { fontSize: "52px" },
  catBadge: {
    position: "absolute", top: "8px", left: "8px",
    background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: 700,
    padding: "3px 10px", borderRadius: "999px",
  },
  arcadeBadge: { background: "#dc2626" },
  hardwareBadge: { background: "#0891b2" },
  otherBadge: { background: "#7c3aed" },
  year: { fontSize: "12px", color: "#64748b", marginBottom: "4px" },
  body: { padding: "12px 14px", flex: 1 },
  name: {
    fontSize: "15px", fontWeight: 700, color: "#1e293b",
    marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  maker: { fontSize: "12px", color: "#64748b", marginBottom: "6px" },
  pills: { display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "4px" },
  hw: { background: "#e0f2fe", color: "#0369a1", fontSize: "12px", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 },
  genre: { background: "#f0fdf4", color: "#166534", fontSize: "12px", padding: "2px 8px", borderRadius: "999px" },
  edition: { fontSize: "12px", color: "#64748b", marginBottom: "4px" },
  tags: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" },
  tag: { background: "#fef9c3", color: "#854d0e", fontSize: "11px", padding: "2px 6px", borderRadius: "4px" },
  moreTag: { background: "#f1f5f9", color: "#64748b", fontSize: "11px", padding: "2px 6px", borderRadius: "4px" },
  editHint: {
    padding: "8px 14px", fontSize: "12px", color: "#94a3b8",
    borderTop: "1px solid #f1f5f9", textAlign: "right", background: "#fafafa",
  },
};
