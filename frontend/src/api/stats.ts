import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

export interface StatItem {
  label: string;
  value: number;
}

export interface StatsResponse {
  x_label: string;
  y_label: string;
  items: StatItem[];
}

export async function fetchStats(xAxis: string, yAxis: string): Promise<StatsResponse> {
  const { data } = await api.get<StatsResponse>("/api/stats/aggregate", {
    params: { x_axis: xAxis, y_axis: yAxis },
  });
  return data;
}
