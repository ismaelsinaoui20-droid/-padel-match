import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, type User } from '@/lib/api';
import { storage } from '@/lib/storage';

const TOKEN_KEY = 'padel-match-token';

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await storage.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        try {
          const me = await api.getMe(storedToken);
          setToken(storedToken);
          setUser(me);
        } catch {
          await storage.deleteItemAsync(TOKEN_KEY);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  async function signIn(email: string, password: string) {
    const { token: newToken, user: newUser } = await api.login(email, password);
    await storage.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  async function signUp(name: string, email: string, password: string) {
    const { token: newToken, user: newUser } = await api.register(name, email, password);
    await storage.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    const { token: newToken, user: newUser } = await api.resetPassword(email, code, newPassword);
    await storage.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function signOut() {
    await storage.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    setUser(await api.getMe(token));
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signUp, signOut, refreshUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
