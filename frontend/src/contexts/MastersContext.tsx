import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchMasters } from "../api/masters";
import type { MasterItem } from "../api/masters";
import { MESSAGES } from "../constants/messages";

interface Masters {
  category: MasterItem[];
  hardware: MasterItem[];
  genre: MasterItem[];
  edition: MasterItem[];
  condition: MasterItem[];
  mastersError: string;
}

const MastersContext = createContext<Masters>({
  category: [],
  hardware: [],
  genre: [],
  edition: [],
  condition: [],
  mastersError: "",
});

export function MastersProvider({ children }: { children: ReactNode }) {
  const [masters, setMasters] = useState<Masters>({
    category: [],
    hardware: [],
    genre: [],
    edition: [],
    condition: [],
    mastersError: "",
  });

  useEffect(() => {
    Promise.all([
      fetchMasters("category"),
      fetchMasters("hardware"),
      fetchMasters("genre"),
      fetchMasters("edition"),
      fetchMasters("condition"),
    ])
      .then(([category, hardware, genre, edition, condition]) => {
        setMasters({ category, hardware, genre, edition, condition, mastersError: "" });
      })
      .catch(() => {
        setMasters((prev) => ({
          ...prev,
          mastersError: MESSAGES.ERR_MASTERS_FETCH_FAILED,
        }));
      });
  }, []);

  return (
    <MastersContext.Provider value={masters}>
      {masters.mastersError && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#fef2f2", borderBottom: "2px solid #fca5a5",
          color: "#dc2626", fontSize: "14px", fontWeight: 600,
          padding: "10px 20px", textAlign: "center",
        }}>
          ⚠ {masters.mastersError}
        </div>
      )}
      {children}
    </MastersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMasters(): Masters {
  return useContext(MastersContext);
}
