import axios from "axios";
import { API_BASE_URL } from "../config";

// 開発時は http://localhost:8000、本番は VITE_API_BASE_URL="" で同一オリジン
// (nginx が /api をバックエンドへプロキシ)
const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const method = err.config?.method?.toUpperCase() ?? "";
    const url = err.config?.url ?? "";
    const status = err.response?.status;
    const data = err.response?.data;

    console.error(`[API] ${method} ${url} → ${status ?? "network error"}`, data ?? err.message);

    let message: string;
    if (data?.detail && typeof data.detail === "string") {
      message = data.detail;
    } else if (status) {
      message = `通信エラーが発生しました (HTTP ${status}: ${method} ${url})`;
    } else {
      message = `サーバーに接続できません (${method} ${url})`;
    }
    return Promise.reject(new Error(message));
  }
);

export default client;