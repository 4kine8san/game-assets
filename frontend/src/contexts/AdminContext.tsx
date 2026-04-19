import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { API_BASE_URL } from "../config";

interface AdminContextType {
  isAdmin: boolean;
  enterAdmin: (password: string) => Promise<string | null>;
  exitAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  enterAdmin: async () => "初期化エラー",
  exitAdmin: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("adminMode") === "true");

  async function enterAdmin(password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAdmin(true);
        sessionStorage.setItem("adminMode", "true");
        return null;
      }
      const body = await res.json().catch(() => ({}));
      return body.detail ?? "パスワードが正しくありません";
    } catch (err) {
      console.error("[API] POST /api/admin/verify → network error", err);
      return "サーバーに接続できません (POST /api/admin/verify)";
    }
  }

  function exitAdmin() {
    setIsAdmin(false);
    sessionStorage.removeItem("adminMode");
  }

  return (
    <AdminContext.Provider value={{ isAdmin, enterAdmin, exitAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
