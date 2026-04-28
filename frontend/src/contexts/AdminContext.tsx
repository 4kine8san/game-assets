import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { API_BASE_URL } from "../config";
import { MESSAGES } from "../constants/messages";

interface AdminContextType {
  isAdmin: boolean;
  enterAdmin: (password: string) => Promise<string | null>;
  exitAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  enterAdmin: async () => MESSAGES.ERR_ADMIN_INIT,
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
      return body.detail ?? MESSAGES.ERR_ADMIN_WRONG_PASSWORD;
    } catch (err) {
      console.error("[API] POST /api/admin/verify → network error", err);
      return MESSAGES.ERR_SERVER_UNREACHABLE;
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
