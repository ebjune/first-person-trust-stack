import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/layout/AuthGuard";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { PnmPage } from "./pages/PnmPage";
import { CnmPage } from "./pages/CnmPage";
import { VtnPage } from "./pages/VtnPage";
import { InfraPage } from "./pages/InfraPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated — wrapped in AppShell */}
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/pnm" element={<PnmPage />} />
            <Route path="/cnm" element={<CnmPage />} />
            <Route path="/vtn" element={<VtnPage />} />
            <Route path="/infra" element={<InfraPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/pnm" replace />} />
          <Route path="*" element={<Navigate to="/pnm" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
