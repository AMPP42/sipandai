
export interface User {
  id: string;
  email: string;
  name: string;
  roles: ('admin_pusat' | 'admin_unit' | 'user_unit')[];
  work_unit_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'admin_pusat' | 'admin_unit' | 'user_unit';

export interface AuthContextType {
  user: User | null;
  session: any;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, work_unit_id?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'work_unit_id'>>) => Promise<{ error?: string }>;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdminPusat: boolean;
  isAdminUnit: boolean;
  isUserUnit: boolean;
}
