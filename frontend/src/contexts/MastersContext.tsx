import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchMasters } from "../api/masters";
import type { MasterItem } from "../api/masters";

interface Masters {
  category: MasterItem[];
  hardware: MasterItem[];
  genre: MasterItem[];
  edition: MasterItem[];
}

const MastersContext = createContext<Masters>({
  category: [],
  hardware: [],
  genre: [],
  edition: [],
});

export function MastersProvider({ children }: { children: ReactNode }) {
  const [masters, setMasters] = useState<Masters>({
    category: [],
    hardware: [],
    genre: [],
    edition: [],
  });

  useEffect(() => {
    Promise.all([
      fetchMasters("category"),
      fetchMasters("hardware"),
      fetchMasters("genre"),
      fetchMasters("edition"),
    ])
      .then(([category, hardware, genre, edition]) => {
        setMasters({ category, hardware, genre, edition });
      })
      .catch(() => {
        console.error("マスタデータの取得に失敗しました。バックエンドの接続を確認してください。");
      });
  }, []);

  return <MastersContext.Provider value={masters}>{children}</MastersContext.Provider>;
}

export function useMasters(): Masters {
  return useContext(MastersContext);
}
