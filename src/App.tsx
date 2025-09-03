
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Apps from "./pages/Apps";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Application pages
import PengajuanMutasi from "./pages/apps/PengajuanMutasi";
import KenaikanPangkat from "./pages/apps/KenaikanPangkat";
import ReminderPensiun from "./pages/apps/ReminderPensiun";
import PengajuanMutasiTerpadu from "./pages/apps/PengajuanMutasiTerpadu";
import KonsultasiSDM from "./pages/apps/KonsultasiSDM";

// Admin pages
import PanelAdmin from "./pages/PanelAdmin";
import Verifikasi from "./pages/Verifikasi";
import AdminPegawai from "./pages/AdminPegawai";
import AdminFormasi from "./pages/AdminFormasi";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";

// User pages
import StatusUsulan from "./pages/StatusUsulan";
import UsulanMutasi from "./pages/UsulanMutasi";
import BuatUsulanMutasi from "./pages/BuatUsulanMutasi";
import DetailUsulanMutasi from "./pages/DetailUsulanMutasi";
import DetailMutasiTerpadu from "./pages/DetailMutasiTerpadu";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
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

            {/* Application routes */}
            <Route path="/apps/pengajuan-mutasi" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PengajuanMutasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/apps/kenaikan-pangkat" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <KenaikanPangkat />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/apps/reminder-pensiun" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReminderPensiun />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/apps/konsultasi-sdm" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <KonsultasiSDM />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/apps/pengajuan-mutasi-terpadu" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PengajuanMutasiTerpadu />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Usulan Mutasi routes */}
            <Route path="/usulan-mutasi" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UsulanMutasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/usulan-mutasi/buat" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BuatUsulanMutasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/usulan-mutasi/:id" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DetailUsulanMutasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Main Admin Panel route */}
            <Route path="/panel-admin" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <PanelAdmin />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/detail-mutasi-terpadu/:id" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DetailMutasiTerpadu />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Legacy admin routes - redirect to main panel */}
            <Route path="/admin" element={<Navigate to="/panel-admin" replace />} />
            <Route path="/verifikasi" element={<Navigate to="/panel-admin?tab=verifikasi-usulan" replace />} />
            <Route path="/admin-pegawai" element={<Navigate to="/panel-admin?tab=database-pegawai" replace />} />
            <Route path="/admin-formasi" element={<Navigate to="/panel-admin?tab=formasi-jabatan" replace />} />
            <Route path="/admin-users" element={<Navigate to="/panel-admin?tab=user-management" replace />} />
            <Route path="/admin-reports" element={<Navigate to="/panel-admin?tab=statistik-laporan" replace />} />

            {/* User routes */}
            <Route path="/status" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StatusUsulan />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
