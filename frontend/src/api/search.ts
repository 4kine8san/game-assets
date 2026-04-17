import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

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
