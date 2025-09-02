
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

// Admin pages
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

            {/* Admin routes (admin_pusat only) */}
            <Route path="/verifikasi" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <Verifikasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <AdminPegawai />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/pegawai" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <AdminPegawai />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/formasi" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <AdminFormasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <AdminUsers />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <AdminReports />
                </DashboardLayout>
              </ProtectedRoute>
            } />

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
