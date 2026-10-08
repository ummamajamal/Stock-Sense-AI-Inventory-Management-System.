import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: UserRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  quickSwitch: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setError(null);
    } catch {
      setUser(null);
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (params: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: UserRole;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.signup(params);
      setUser(res.user);
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const quickSwitch = async (role: UserRole) => {
    if (role === 'manager') {
      await login('manager@stocksense.com', 'manager123');
    } else {
      await login('staff@stocksense.com', 'staff123');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        quickSwitch,
        refreshUser,
        clearError,
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
