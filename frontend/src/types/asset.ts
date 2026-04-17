export interface AssetPhoto {
  id: number;
  file_name: string;
  url: string;
  thumb_url?: string;
  sort_order: number;
}

export interface Asset {
  id: number;
  name: string;
  asset_category: "consumer" | "arcade" | "hardware" | "other";
  hardware?: string;
  maker?: string;
  genre?: string;
  edition?: string;
  official_url?: string;
  release_year?: string;
  asset_value?: number;
  tags?: string;
  description?: string;
  thumbnail_url?: string;
  photos: AssetPhoto[];
  created_at?: string;
  updated_at?: string;
}

export interface AssetListResponse {
  items: Asset[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AssetFilters {
  search: string;
  asset_category: string;
  hardware: string;
  genre: string;
  sort_by: string;
  sort_dir: string;
}

export const SORT_OPTIONS = [
  { value: "name|asc", label: "資産名順（昇順）" },
  { value: "name|desc", label: "資産名順（降順）" },
  { value: "created_at|desc", label: "登録日（新しい順）" },
  { value: "created_at|asc", label: "登録日（古い順）" },
];
