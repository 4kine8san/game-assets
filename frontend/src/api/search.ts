import client from "./client";

const api = client;

export interface GameSearchResult {
  maker: string | null;
  genre: string | null;
  release_year: string | null;
  official_url: string | null;
  found: boolean;
  source_title: string | null;
}

export async function searchGameInfo(title: string): Promise<GameSearchResult> {
  const { data } = await api.post<GameSearchResult>("/api/search/game-info", { title });
  return data;
}
