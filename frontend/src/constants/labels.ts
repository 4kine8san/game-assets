export const VIEW_OPTIONS = [
  { mode: "large" as const, label: "大" },
  { mode: "medium" as const, label: "中" },
  { mode: "small" as const, label: "小" },
  { mode: "grid" as const, label: "グリッド" },
];

export const STATS_X_OPTIONS = [
  { value: "hardware", label: "ハード" },
  { value: "genre", label: "ジャンル" },
  { value: "asset_category", label: "種類" },
  { value: "edition", label: "エディション" },
  { value: "release_year", label: "販売年" },
  { value: "ownership_status", label: "保有状況" },
];

export const OWNERSHIP_STATUS_OPTIONS = [
  { value: "holding",     label: "保有中" },
  { value: "listed",      label: "出品中" },
  { value: "negotiating", label: "交渉中" },
  { value: "shipped",     label: "送付済" },
  { value: "transferred", label: "譲渡済" },
];

export const OWNERSHIP_STATUS_LABEL: Record<string, string> = {
  holding:     "保有中",
  listed:      "出品中",
  negotiating: "交渉中",
  shipped:     "送付済",
  transferred: "譲渡済",
};

export const OWNERSHIP_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  holding:     { bg: "#f1f5f9", text: "#475569" },
  listed:      { bg: "#fef3c7", text: "#92400e" },
  negotiating: { bg: "#ffedd5", text: "#9a3412" },
  shipped:     { bg: "#dbeafe", text: "#1e40af" },
  transferred: { bg: "#e2e8f0", text: "#64748b" },
};

export const STATS_Y_OPTIONS = [
  { value: "count", label: "資産数" },
  { value: "total_value", label: "合計評価額（円）" },
  { value: "avg_value", label: "平均評価額（円）" },
];

export const CATEGORY_LABEL: Record<string, string> = {
  arcade: "アーケード",
  hardware: "ハード",
  other: "その他",
  consumer: "家庭用",
};

export const SORT_OPTIONS = [
  { value: "name|asc", label: "資産名順（昇順）" },
  { value: "name|desc", label: "資産名順（降順）" },
  { value: "created_at|desc", label: "登録日（新しい順）" },
  { value: "created_at|asc", label: "登録日（古い順）" },
  { value: "asset_value|desc", label: "評価額（高い順）" },
  { value: "asset_value|asc", label: "評価額（低い順）" },
];