import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MastersProvider } from "./contexts/MastersContext";
import AssetListPage from "./pages/AssetListPage";
import AssetRegisterPage from "./pages/AssetRegisterPage";
import AssetEditPage from "./pages/AssetEditPage";
import AssetStatsPage from "./pages/AssetStatsPage";

export default function App() {
  return (
    <MastersProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AssetListPage />} />
          <Route path="/register" element={<AssetRegisterPage />} />
          <Route path="/assets/:id/edit" element={<AssetEditPage />} />
          <Route path="/stats" element={<AssetStatsPage />} />
        </Routes>
      </BrowserRouter>
    </MastersProvider>
  );
}
