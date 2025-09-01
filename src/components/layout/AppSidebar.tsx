
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings,
  Database,
  CheckCircle,
  Clock,
  MessageCircle,
  BarChart3,
  UserCheck,
  Shield
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `sidebar-nav-item ${isActive ? 'sidebar-nav-active' : ''}`;

  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ];

    if (user?.role === 'admin_pusat') {
      return [
        ...commonItems,
        { 
          title: "Verifikasi Usulan", 
          url: "/verifikasi", 
          icon: CheckCircle,
          badge: "3" // Mock notification count
        },
        { title: "Panel Admin", url: "/admin", icon: Shield },
        { title: "Database Pegawai", url: "/admin/pegawai", icon: Database },
        { title: "Formasi Jabatan", url: "/admin/formasi", icon: UserCheck },
        { title: "User Management", url: "/admin/users", icon: Users },
        { title: "Statistik & Laporan", url: "/admin/reports", icon: BarChart3 },
        { title: "Portal Aplikasi", url: "/apps", icon: FileText },
      ];
    } else {
      return [
        ...commonItems,
        { title: "Portal Aplikasi", url: "/apps", icon: FileText },
        { title: "Status Usulan", url: "/status", icon: Clock },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar
      className={`transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
      collapsible
    >
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Building2 className="w-8 h-8 text-sidebar-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">SIPANDAI</h2>
              <p className="text-xs text-sidebar-foreground/70">Portal Administrasi ASN</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 mb-2">
            {!collapsed && "Menu Utama"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        {user && (
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {user.role === 'admin_pusat' ? 'Admin Pusat' : 'Admin Unit'}
                  </p>
                  {user.unit && (
                    <p className="text-xs text-sidebar-foreground/50 truncate">
                      {user.unit}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
