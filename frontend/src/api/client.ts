import axios from "axios";

const client = axios.create({ baseURL: "http://localhost:8000" });

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