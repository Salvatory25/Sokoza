import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, Shop, UserRole } from '../types/database';
import { fetchShopByOwnerId } from '../lib/api';
import { SEED_SHOPS } from '../lib/seedData';
import { useToast } from './ToastContext';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  profile?: Profile | null;
  shop?: Shop | null;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole, shopIndex?: number) => void;
  refreshUserShop: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_AUTH_STORAGE_KEY = 'sokoza_dev_user_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSupabaseUserSession(userId: string, email: string) {
    try {
      // 1. Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const role: UserRole = roleData?.role || 'seller'; // Default registered users are sellers

      // 2. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 3. Fetch shop if seller
      const shop = await fetchShopByOwnerId(userId);

      const sessionObj: UserSession = {
        id: userId,
        email,
        role,
        profile: profileData,
        shop,
      };

      setUser(sessionObj);
    } catch (err) {
      console.error('Error loading Supabase user data:', err);
    }
  }

  // Load initial session
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadSupabaseUserSession(session.user.id, session.user.email || '');
          }
        } catch (err) {
          console.error('Failed to restore Supabase session:', err);
        }
      } else {
        // Dev fallback from localStorage
        try {
          const saved = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            // Default demo seller for seamless previewing
            const defaultSeller: UserSession = {
              id: 'user-seller-1',
              email: 'seller@kariakootech.co.tz',
              role: 'seller',
              profile: {
                id: 'user-seller-1',
                display_name: 'Juma Ally (Kariakoo Tech)',
                phone: '+255 712 345 678',
                preferred_language: 'en',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              shop: SEED_SHOPS[0],
            };
            setUser(defaultSeller);
          }
        } catch {
          // Ignore
        }
      }

      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            await loadSupabaseUserSession(session.user.id, session.user.email || '');
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const refreshUserShop = async () => {
    if (!user) return;
    const shop = await fetchShopByOwnerId(user.id);
    const updated = { ...user, shop };
    setUser(updated);
    if (!isSupabaseConfigured()) {
      localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
      showToast('Welcome back to Sokoza!', 'success');
      return { success: true };
    }

    // Dev mode login
    const isDemAdmin = email.toLowerCase().includes('admin');
    const demoUser: UserSession = {
      id: isDemAdmin ? 'user-admin-1' : `user-${Date.now()}`,
      email,
      role: isDemAdmin ? 'admin' : 'seller',
      profile: {
        id: isDemAdmin ? 'user-admin-1' : `user-${Date.now()}`,
        display_name: isDemAdmin ? 'Super Administrator' : email.split('@')[0],
        phone: '+255 700 000 000',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      shop: isDemAdmin ? null : SEED_SHOPS[0],
    };

    setUser(demoUser);
    localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    showToast(`Signed in as ${demoUser.role.toUpperCase()}`, 'success');
    return { success: true };
  };

  const signup = async (
    email: string,
    pass: string,
    name: string,
    phone: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            display_name: name,
            phone,
          },
        },
      });

      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create initial profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: name,
          phone,
          preferred_language: 'en',
        });

        // Assign seller role (safe default; admin can never be self-assigned)
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'seller',
        });
      }

      showToast('Registration successful! Please verify your email.', 'success');
      return { success: true };
    }

    // Dev mode signup
    const newDevUser: UserSession = {
      id: `seller-${Date.now()}`,
      email,
      role: 'seller',
      profile: {
        id: `seller-${Date.now()}`,
        display_name: name,
        phone,
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      shop: null, // New seller without shop yet
    };

    setUser(newDevUser);
    localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(newDevUser));
    showToast('Account created successfully! Welcome to Sokoza.', 'success');
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
    showToast('Signed out of Sokoza', 'info');
  };

  const switchDemoRole = (role: UserRole, shopIndex = 0) => {
    let demoSession: UserSession;
    if (role === 'admin') {
      demoSession = {
        id: 'user-admin-1',
        email: 'admin@sokoza.co.tz',
        role: 'admin',
        profile: {
          id: 'user-admin-1',
          display_name: 'Sokoza Platform Admin',
          phone: '+255 788 123 456',
          preferred_language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        shop: null,
      };
    } else if (role === 'seller') {
      const selectedShop = SEED_SHOPS[shopIndex] || SEED_SHOPS[0];
      demoSession = {
        id: selectedShop.owner_id,
        email: `seller@${selectedShop.slug}.co.tz`,
        role: 'seller',
        profile: {
          id: selectedShop.owner_id,
          display_name: `${selectedShop.name} Owner`,
          phone: selectedShop.whatsapp_number,
          preferred_language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        shop: selectedShop,
      };
    } else {
      demoSession = {
        id: 'user-customer-1',
        email: 'customer@gmail.com',
        role: 'customer',
        profile: {
          id: 'user-customer-1',
          display_name: 'Zawadi Mwangi',
          phone: '+255 754 999 888',
          preferred_language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        shop: null,
      };
    }

    setUser(demoSession);
    localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(demoSession));
    showToast(`Switched active view to ${role.toUpperCase()}`, 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'admin',
        isSeller: user?.role === 'seller' || user?.role === 'admin',
        login,
        signup,
        logout,
        switchDemoRole,
        refreshUserShop,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
