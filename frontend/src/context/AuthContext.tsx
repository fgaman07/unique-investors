import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  email?: string;
  mobile: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  status?: 'ACTIVE' | 'BLOCKED';
  rank: string;
  address?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  tdsPercentage?: number;
  joiningDate: string;
  sponsor?: {
    userId: string;
    name: string;
  };
}

interface LoginResponse extends AuthUser {
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (userId: string, password: string) => Promise<LoginResponse | null>;
  logout: () => void;
  targetUserId: string | null;
  setTargetUserId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(storedUser ? JSON.parse(storedUser) : null);
  const [token, setToken] = useState<string | null>(storedToken);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const login = async (userId: string, password: string): Promise<LoginResponse | null> => {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { userId, password });
      setUser(data);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      return data;
    } catch (error: any) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, targetUserId, setTargetUserId }}>
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
