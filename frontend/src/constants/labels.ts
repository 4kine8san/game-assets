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
];

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