import type { Asset, AssetListResponse, AssetPhoto } from "../types/asset";
import client from "./client";

const api = client;

export interface FetchAssetsParams {
  page?: number;
  limit?: number;
  search?: string;
  asset_category?: string;
  hardware?: string;
  genre?: string;
  sort_by?: string;
  sort_dir?: string;
}

export async function fetchAssets(params: FetchAssetsParams): Promise<AssetListResponse> {
  const { data } = await api.get<AssetListResponse>("/api/assets", { params });
  return data;
}

export async function fetchAsset(id: number): Promise<Asset> {
  const { data } = await api.get<Asset>(`/api/assets/${id}`);
  return data;
}

export async function createAsset(formData: FormData): Promise<Asset> {
  const { data } = await api.post<Asset>("/api/assets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateAsset(id: number, body: Record<string, unknown>): Promise<Asset> {
  const { data } = await api.put<Asset>(`/api/assets/${id}`, body);
  return data;
}

export async function deleteAsset(id: number): Promise<void> {
  await api.delete(`/api/assets/${id}`);
}

export async function copyAsset(id: number): Promise<Asset> {
  const { data } = await api.post<Asset>(`/api/assets/${id}/copy`);
  return data;
}

export async function addPhotos(assetId: number, formData: FormData): Promise<Asset> {
  const { data } = await api.post<Asset>(`/api/assets/${assetId}/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function rotatePhoto(assetId: number, photoId: number, degrees: number): Promise<AssetPhoto> {
  const { data } = await api.post<AssetPhoto>(`/api/assets/${assetId}/photos/${photoId}/rotate`, { degrees });
  return data;
}

export async function reorderPhotos(assetId: number, photoIds: number[]): Promise<Asset> {
  const { data } = await api.put<Asset>(`/api/assets/${assetId}/photos/reorder`, { photo_ids: photoIds });
  return data;
}

export async function deletePhoto(assetId: number, photoId: number): Promise<void> {
  await api.delete(`/api/assets/${assetId}/photos/${photoId}`);
}

export async function downloadAssets(
  format: "csv" | "json",
  filters: Pick<FetchAssetsParams, "search" | "asset_category" | "hardware" | "genre">
): Promise<void> {
  const res = await api.get("/api/assets/download", {
    params: { format, ...filters },
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `assets.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
