import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth.jsx";
import { LanguageProvider } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Customers from "@/pages/Customers";
import MapAnalysis from "@/pages/MapAnalysis";
import CreatorAnalysis from "@/pages/CreatorAnalysis";
import PerluDiSS from "@/pages/PerluDiSS";
import SegmenExport from "@/pages/SegmenExport";
import Pengaturan from "@/pages/Pengaturan";
import Tentang from "@/pages/Tentang";
import ProductRevenue from "@/pages/ProductRevenue";
import Reminder from "@/pages/Reminder";
import AuditLog from "@/pages/AuditLog";
import "@/App.css";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500">Memuat...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster richColors position="top-right" theme="dark" />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <Protected>
                    <Layout />
                  </Protected>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="upload" element={<Upload />} />
                <Route path="pelanggan" element={<Customers />} />
                <Route path="peta" element={<MapAnalysis />} />
                <Route path="creator" element={<CreatorAnalysis />} />
                <Route path="perlu-ss" element={<PerluDiSS />} />
                <Route path="segmen" element={<SegmenExport />} />
                <Route path="produk" element={<ProductRevenue />} />
                <Route path="reminder" element={<Reminder />} />
                <Route path="riwayat" element={<AuditLog />} />
                <Route path="pengaturan" element={<Pengaturan />} />
                <Route path="tentang" element={<Tentang />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
