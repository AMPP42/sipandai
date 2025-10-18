import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ErrorBoundary from '@/components/ui/error-boundary';
import { GlobalErrorBoundary } from '@/components/providers/GlobalErrorBoundary';

import Dashboard from "./pages/Dashboard";
// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Apps from "./pages/Apps";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ChatDashboard from "./pages/ChatDashboard";

// Application pages
import PengajuanUsulanBaru from "./pages/apps/PengajuanUsulanBaru";
import EditDraftUsulan from "./pages/apps/EditDraftUsulan";
import EditPerbaikanUsulan from "./pages/apps/EditPerbaikanUsulan";
import PengajuanKenaikanPangkatBaru from "./pages/apps/PengajuanKenaikanPangkatBaru";
import EditDraftKenaikanPangkat from "./pages/apps/EditDraftKenaikanPangkat";
import EditPerbaikanKenaikanPangkat from "./pages/apps/EditPerbaikanKenaikanPangkat";
import UploadDokumenKenaikanPangkat from "./pages/apps/UploadDokumenKenaikanPangkat";
import PengajuanPensiunBaru from "./pages/apps/PengajuanPensiunBaru";
import EditDraftPensiun from "./pages/apps/EditDraftPensiun";
import EditPerbaikanPensiun from "./pages/apps/EditPerbaikanPensiun";
import Pensiun from "./pages/apps/Pensiun";
import KirimReminderPensiun from "./pages/apps/KirimReminderPensiun";
import ManageReminderTemplates from "./pages/apps/ManageReminderTemplates";
import PengajuanMutasi from "./pages/apps/PengajuanMutasi";
import KenaikanPangkat from "./pages/apps/KenaikanPangkat";
import ReminderPensiun from "./pages/apps/ReminderPensiun";
import PengajuanMutasiTerpadu from "./pages/apps/PengajuanMutasiTerpadu";
import KonsultasiSDM from "./pages/apps/KonsultasiSDM";
import JadwalKonsultasi from "./pages/apps/JadwalKonsultasi";

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
import DetailKenaikanPangkat from "./pages/DetailKenaikanPangkat";
import DetailPensiun from "./pages/DetailPensiun";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <GlobalErrorBoundary>
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
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/apps" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <Apps />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <Settings />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Application routes */}
              <Route path="/apps/pengajuan-mutasi" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PengajuanMutasi />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/kenaikan-pangkat" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <KenaikanPangkat />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/pensiun" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <Pensiun />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/reminder-pensiun" element={<Navigate to="/apps/pensiun" replace />} />

              <Route path="/apps/konsultasi-sdm" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <KonsultasiSDM />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/jadwal-konsultasi" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <JadwalKonsultasi />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/pengajuan-mutasi-terpadu" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PengajuanMutasiTerpadu />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/pengajuan-usulan-baru" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PengajuanUsulanBaru />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/edit-draft-usulan/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <EditDraftUsulan />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/edit-perbaikan-usulan/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <EditPerbaikanUsulan />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/pengajuan-kenaikan-pangkat-baru" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PengajuanKenaikanPangkatBaru />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/upload-dokumen-kenaikan-pangkat/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <UploadDokumenKenaikanPangkat />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/edit-draft-kenaikan-pangkat/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <EditDraftKenaikanPangkat />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/edit-perbaikan-kenaikan-pangkat/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <EditPerbaikanKenaikanPangkat />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/pengajuan-pensiun-baru" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PengajuanPensiunBaru />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/edit-draft-pensiun/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <EditDraftPensiun />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/edit-perbaikan-pensiun/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <EditPerbaikanPensiun />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/kirim-reminder-pensiun/:employeeId" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <KirimReminderPensiun />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/apps/manage-reminder-templates" element={
                <ProtectedRoute requiredRole="admin_pusat">
                  <DashboardLayout>
                    <ErrorBoundary>
                      <ManageReminderTemplates />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Usulan Mutasi routes */}
              <Route path="/usulan-mutasi" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <UsulanMutasi />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/usulan-mutasi/buat" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <BuatUsulanMutasi />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/usulan-mutasi/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <DetailUsulanMutasi />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Main Admin Panel route - accessible by both admin_pusat and admin_unit */}
              <Route path="/panel-admin" element={
                <ProtectedRoute requiredRole={['admin_pusat', 'admin_unit']}>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PanelAdmin />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/detail-kenaikan-pangkat/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <DetailKenaikanPangkat />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/detail-pensiun/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <DetailPensiun />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              <Route path="/detail-mutasi-terpadu/:id" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <DetailMutasiTerpadu />
                    </ErrorBoundary>
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
                    <ErrorBoundary>
                      <StatusUsulan />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              } />

              {/* Chat Dashboard - Admin Pusat only */}
              <Route path="/chat-dashboard" element={
                <ProtectedRoute requiredRole="admin_pusat">
                  <DashboardLayout>
                    <ErrorBoundary>
                      <ChatDashboard />
                    </ErrorBoundary>
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
  </GlobalErrorBoundary>
);

export default App;