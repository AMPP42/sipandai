
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin_pusat' | 'admin_unit';
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  session: any;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: string, unit?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}
