
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthContextType } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to prevent blocking the auth state change callback
          setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              // Fetch profile data
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, name, unit, status, created_at, updated_at')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profileError) {
                console.error('Error fetching user profile:', profileError);
                if (isMounted) setUser(null);
                return;
              }

              // If profile doesn't exist or not approved, don't set user
              if (!profile || profile.status !== 'active') {
                console.log('User profile pending approval or not found');
                if (isMounted) setUser(null);
                return;
              }

              // Fetch role from user_roles table
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (roleError) {
                console.error('Error fetching user role:', roleError);
              }

              if (isMounted && profile) {
                setUser({
                  id: profile.id,
                  email: session.user.email!,
                  name: profile.name,
                  role: (roleData?.role || 'viewer') as 'admin_pusat' | 'admin_unit',
                  unit: profile.unit,
                  created_at: profile.created_at,
                  updated_at: profile.updated_at,
                });
              }
            } catch (err) {
              console.error('Profile fetch error:', err);
              if (isMounted) setUser(null);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        if (isMounted) setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        if (!session) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message };
    } catch (err: any) {
      return { error: err.message || 'Terjadi kesalahan saat login' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string, unit?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            unit
          }
        }
      });
      return { error: error?.message };
    } catch (err: any) {
      return { error: err.message || 'Terjadi kesalahan saat registrasi' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'unit'>>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error: error?.message };
    } catch (err: any) {
      return { error: err.message || 'Terjadi kesalahan saat update profil' };
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
