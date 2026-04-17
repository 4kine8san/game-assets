import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

export interface MasterItem {
  value: string;
  label: string;
}

export async function fetchMasters(type: string): Promise<MasterItem[]> {
  const { data } = await api.get<MasterItem[]>(`/api/masters/${type}`);
  return data;
}
