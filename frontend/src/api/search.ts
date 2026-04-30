import client from "./client";

const api = client;

export interface GameSearchResult {
  maker: string | null;
  genre: string | null;
  release_year: string | null;
  official_url: string | null;
  price_used: number | null;
  price_new: number | null;
  found: boolean;
  source_title: string | null;
}

export async function searchGameInfo(title: string, hardware?: string | null): Promise<GameSearchResult> {
  const { data } = await api.post<GameSearchResult>("/api/search/game-info", { title, hardware: hardware ?? null });
  return data;
}