
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
import Verifikasi from "./pages/Verifikasi";
import AdminPegawai from "./pages/AdminPegawai";
import AdminFormasi from "./pages/AdminFormasi";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import StatusUsulan from "./pages/StatusUsulan";

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
                  <Verifikasi />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin_pusat">
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Panel Admin</h1>
                    <p className="text-gray-600">Panel administrasi - akan segera diimplementasikan</p>
                  </div>
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
            
            {/* Admin Unit Only Routes */}
            <Route path="/status" element={
              <ProtectedRoute requiredRole="admin_unit">
                <DashboardLayout>
                  <StatusUsulan />
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
