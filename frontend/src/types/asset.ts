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
  condition?: string;
  ownership_status: string;
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
  ownership_status: string;
  sort_by: string;
  sort_dir: string;
}

export { SORT_OPTIONS } from "../constants/labels";
