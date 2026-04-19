import client from "./client";

const api = client;

export interface MasterItem {
  value: string;
  label: string;
}

export async function fetchMasters(type: string): Promise<MasterItem[]> {
  const { data } = await api.get<MasterItem[]>(`/api/masters/${type}`);
  return data;
}
