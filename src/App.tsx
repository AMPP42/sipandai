import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Apps from "./pages/Apps";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/apps" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Apps />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            {/* Admin Pusat Only Routes */}
            <Route path="/verifikasi" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Verifikasi Usulan</h1>
                    <p className="text-gray-600">Halaman verifikasi usulan - akan segera diimplementasikan</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Panel Admin</h1>
                    <p className="text-gray-600">Panel administrasi - akan segera diimplementasikan</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            {/* Admin Unit Only Routes */}
            <Route path="/status" element={
              <ProtectedRoute requiredRole="admin_unit">
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Status Usulan</h1>
                    <p className="text-gray-600">Status usulan Anda - akan segera diimplementasikan</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
