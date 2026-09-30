import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: { email: string; id: string; role?: string } | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  demoSignIn: (role?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'atelier_admin_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string; id: string; role?: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isConfigured) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (mounted) {
            if (!error && data.session) {
              setSession(data.session);
              setUser({
                id: data.session.user.id,
                email: data.session.user.email || 'admin@atelier.store',
                role: 'Store Owner',
              });
            } else {
              // check local demo persistence
              const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
              if (savedUser) {
                setUser(JSON.parse(savedUser));
              }
            }
          }
        } catch (err) {
          console.error('Error fetching Supabase auth session:', err);
        }
      } else {
        // Unconfigured mode: check if local demo user is saved
        const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }
      }

      if (mounted) setIsLoading(false);
    }

    initAuth();

    // Listen to Supabase auth events if configured
    let subscription: { unsubscribe: () => void } | null = null;
    if (isConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (!mounted) return;
          setSession(currentSession);
          if (currentSession?.user) {
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email || 'admin@atelier.store',
              role: 'Store Owner',
            });
          } else {
            setUser(null);
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.warn('Could not subscribe to Supabase auth:', err);
      }
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setIsLoading(false);
          return { error };
        }
        if (data.session) {
          setSession(data.session);
          setUser({
            id: data.user?.id || 'usr-adm',
            email: data.user?.email || email,
            role: 'Store Director',
          });
        }
        setIsLoading(false);
        return { error: null };
      } else {
        // Offline / Demo fallback
        const mockUser = {
          id: 'adm-demo-01',
          email,
          role: 'Store Director',
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        setIsLoading(false);
        return { error: null };
      }
    } catch (err) {
      setIsLoading(false);
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: Error | null; needsConfirmation?: boolean }> => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        setIsLoading(false);
        if (error) return { error };
        if (data.session) {
          setSession(data.session);
          setUser({
            id: data.user?.id || 'usr-new',
            email: data.user?.email || email,
            role: 'Store Admin',
          });
          return { error: null, needsConfirmation: false };
        }
        return { error: null, needsConfirmation: true };
      } else {
        const mockUser = {
          id: 'adm-' + Date.now(),
          email,
          role: 'Store Admin',
        };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        setIsLoading(false);
        return { error: null, needsConfirmation: false };
      }
    } catch (err) {
      setIsLoading(false);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  const demoSignIn = (role = 'Lead Merchant') => {
    const demoUser = {
      id: 'demo-director-01',
      email: 'ashishshrivastava71433@gmail.com',
      role,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        demoSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
