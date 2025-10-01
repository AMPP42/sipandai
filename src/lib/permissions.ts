import { User } from '@/types/auth';

// Define all available permissions in the system
export const PERMISSIONS = {
  // Admin Panel Access
  VIEW_ADMIN_PANEL: 'view_admin_panel',
  VIEW_DATABASE_PEGAWAI: 'view_database_pegawai',
  VIEW_FORMASI: 'view_formasi',
  VIEW_USER_MANAGEMENT: 'view_user_management',
  VIEW_REPORTS: 'view_reports',
  VIEW_VERIFIKASI: 'view_verifikasi',
  
  // Data Management
  MANAGE_ALL_DATA: 'manage_all_data',
  MANAGE_UNIT_DATA: 'manage_unit_data',
  
  // Applications Access
  ACCESS_MUTASI_APP: 'access_mutasi_app',
  ACCESS_PANGKAT_APP: 'access_pangkat_app',
  ACCESS_PENSIUN_APP: 'access_pensiun_app',
  ACCESS_KONSULTASI_APP: 'access_konsultasi_app',
  
  // Consultations and FAQ Management
  MANAGE_CONSULTATIONS: 'manage_consultations',
  MANAGE_FAQ: 'manage_faq',
  MANAGE_APPOINTMENTS: 'manage_appointments',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin_pusat: [
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.VIEW_DATABASE_PEGAWAI,
    PERMISSIONS.VIEW_FORMASI,
    PERMISSIONS.VIEW_USER_MANAGEMENT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_VERIFIKASI,
    PERMISSIONS.MANAGE_ALL_DATA,
    PERMISSIONS.ACCESS_MUTASI_APP,
    PERMISSIONS.ACCESS_PANGKAT_APP,
    PERMISSIONS.ACCESS_PENSIUN_APP,
    PERMISSIONS.ACCESS_KONSULTASI_APP,
    PERMISSIONS.MANAGE_CONSULTATIONS,
    PERMISSIONS.MANAGE_FAQ,
    PERMISSIONS.MANAGE_APPOINTMENTS,
  ],
  admin_unit: [
    PERMISSIONS.VIEW_DATABASE_PEGAWAI,
    PERMISSIONS.VIEW_VERIFIKASI,
    PERMISSIONS.MANAGE_UNIT_DATA,
    PERMISSIONS.ACCESS_MUTASI_APP,
    PERMISSIONS.ACCESS_PANGKAT_APP,
    PERMISSIONS.ACCESS_PENSIUN_APP,
    PERMISSIONS.ACCESS_KONSULTASI_APP,
  ],
};

// Application definitions with access control
export interface AppDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  requiredPermission: Permission;
  availableForRoles: string[];
  showStatsForRoles?: string[];
  unitScoped?: boolean; // Whether data is scoped to user's unit
}

export const APPLICATIONS: AppDefinition[] = [
  {
    id: 'mutasi',
    title: 'Pengajuan Berkas Usulan Mutasi',
    description: 'Sistem pengajuan mutasi pegawai dengan tracking timeline dan notifikasi real-time',
    route: '/apps/pengajuan-mutasi-terpadu',
    requiredPermission: PERMISSIONS.ACCESS_MUTASI_APP,
    availableForRoles: ['admin_pusat', 'admin_unit'],
    showStatsForRoles: ['admin_pusat', 'admin_unit'],
    unitScoped: true,
  },
  {
    id: 'pangkat',
    title: 'Pengajuan Kenaikan Pangkat',
    description: 'Validasi syarat otomatis dan checklist dokumen persyaratan kenaikan pangkat',
    route: '/apps/kenaikan-pangkat',
    requiredPermission: PERMISSIONS.ACCESS_PANGKAT_APP,
    availableForRoles: ['admin_pusat', 'admin_unit'],
    showStatsForRoles: ['admin_pusat', 'admin_unit'],
    unitScoped: true,
  },
  {
    id: 'pensiun',
    title: 'Administrasi & Reminder Pensiun',
    description: 'Auto-reminder dan dashboard countdown persiapan pensiun pegawai',
    route: '/apps/reminder-pensiun',
    requiredPermission: PERMISSIONS.ACCESS_PENSIUN_APP,
    availableForRoles: ['admin_pusat', 'admin_unit'],
    showStatsForRoles: ['admin_pusat', 'admin_unit'],
    unitScoped: true,
  },
  {
    id: 'konsultasi',
    title: 'Panduan Layanan Mutasi, Kenaikan Pangkat, dan Pensiun',
    description: 'Ticketing system, layanan konsultasi, panduan, dan FAQ',
    route: '/apps/konsultasi-sdm',
    requiredPermission: PERMISSIONS.ACCESS_KONSULTASI_APP,
    availableForRoles: ['admin_pusat', 'admin_unit'],
    showStatsForRoles: ['admin_pusat'],
    unitScoped: false,
  },
];

// Utility functions for permission checks
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

export const canAccessApplication = (user: User | null, appId: string): boolean => {
  if (!user) return false;
  const app = APPLICATIONS.find(a => a.id === appId);
  if (!app) return false;
  
  return app.availableForRoles.includes(user.role) && 
         hasPermission(user, app.requiredPermission);
};

export const getAccessibleApplications = (user: User | null): AppDefinition[] => {
  if (!user) return [];
  
  return APPLICATIONS.filter(app => 
    app.availableForRoles.includes(user.role) && 
    hasPermission(user, app.requiredPermission)
  );
};

export const canViewStats = (user: User | null, appId: string): boolean => {
  if (!user) return false;
  const app = APPLICATIONS.find(a => a.id === appId);
  if (!app) return false;
  
  return app.showStatsForRoles?.includes(user.role) || false;
};

export const isDataScopedToUnit = (appId: string): boolean => {
  const app = APPLICATIONS.find(a => a.id === appId);
  return app?.unitScoped || false;
};

export const canManageAllData = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.MANAGE_ALL_DATA);
};

export const canManageUnitData = (user: User | null): boolean => {
  return hasPermission(user, PERMISSIONS.MANAGE_UNIT_DATA);
};

// Admin panel tab permissions
export interface AdminTabDefinition {
  id: string;
  title: string;
  requiredPermission: Permission;
  availableForRoles: string[];
}

export const ADMIN_TABS: AdminTabDefinition[] = [
  {
    id: 'database-pegawai',
    title: 'Database Pegawai',
    requiredPermission: PERMISSIONS.VIEW_DATABASE_PEGAWAI,
    availableForRoles: ['admin_pusat', 'admin_unit'],
  },
  {
    id: 'formasi-jabatan',
    title: 'Formasi Jabatan',
    requiredPermission: PERMISSIONS.VIEW_FORMASI,
    availableForRoles: ['admin_pusat'],
  },
  {
    id: 'verifikasi-usulan',
    title: 'Verifikasi Usulan',
    requiredPermission: PERMISSIONS.VIEW_VERIFIKASI,
    availableForRoles: ['admin_pusat', 'admin_unit'],
  },
  {
    id: 'user-management',
    title: 'User Management',
    requiredPermission: PERMISSIONS.VIEW_USER_MANAGEMENT,
    availableForRoles: ['admin_pusat'],
  },
  {
    id: 'statistik-laporan',
    title: 'Statistik & Laporan',
    requiredPermission: PERMISSIONS.VIEW_REPORTS,
    availableForRoles: ['admin_pusat'],
  },
  {
    id: 'konsultasi-tiket',
    title: 'Tiket Konsultasi',
    requiredPermission: PERMISSIONS.MANAGE_CONSULTATIONS,
    availableForRoles: ['admin_pusat'],
  },
  {
    id: 'faq-management',
    title: 'Kelola FAQ',
    requiredPermission: PERMISSIONS.MANAGE_FAQ,
    availableForRoles: ['admin_pusat'],
  },
  {
    id: 'appointment-management',
    title: 'Kelola Appointment',
    requiredPermission: PERMISSIONS.MANAGE_APPOINTMENTS,
    availableForRoles: ['admin_pusat'],
  },
];

export const getAccessibleAdminTabs = (user: User | null): AdminTabDefinition[] => {
  if (!user) return [];
  
  return ADMIN_TABS.filter(tab => 
    tab.availableForRoles.includes(user.role) && 
    hasPermission(user, tab.requiredPermission)
  );
};

export const canAccessAdminTab = (user: User | null, tabId: string): boolean => {
  if (!user) return false;
  const tab = ADMIN_TABS.find(t => t.id === tabId);
  if (!tab) return false;
  
  return tab.availableForRoles.includes(user.role) && 
         hasPermission(user, tab.requiredPermission);
};
