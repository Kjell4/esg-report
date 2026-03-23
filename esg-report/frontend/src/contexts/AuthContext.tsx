import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, ApiUser } from '../services/api';

export type UserRole = 'administrator' | 'respondent' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function apiUserToUser(u: ApiUser): User {
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: u.role,
    companyId: u.companyId ? String(u.companyId) : undefined,
    companyName: u.companyName,
    isBlocked: u.isBlocked,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('esg_user');
    const token = localStorage.getItem('esg_access_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const apiUser = await authApi.login(email, password);
    const u = apiUserToUser(apiUser);
    setUser(u);
    localStorage.setItem('esg_user', JSON.stringify(u));
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    const apiUser = await authApi.register(email, password, name, role);
    const u = apiUserToUser(apiUser);
    setUser(u);
    localStorage.setItem('esg_user', JSON.stringify(u));
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
