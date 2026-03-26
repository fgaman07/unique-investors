import { createContext, useContext, useState, useCallback } from 'react';
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
  panNo?: string;
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

interface LoginApiResponse {
  id: string;
  userId: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  status: 'ACTIVE' | 'BLOCKED';
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (userId: string, password: string) => Promise<{ user: AuthUser; token: string } | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  targetUserId: string | null;
  setTargetUserId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — silient refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't refresh if we are on the login or refresh page
      if (originalRequest.url === '/auth/login' || originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.token;

        // Update local storage and request headers
        localStorage.setItem('token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — log out
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(storedUser ? JSON.parse(storedUser) : null);
  const [token, setToken] = useState<string | null>(storedToken);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch {
      // Silently fail — interceptor handles 401
    }
  }, []);

  const login = async (userId: string, password: string): Promise<{ user: AuthUser; token: string } | null> => {
    try {
      const { data: loginData } = await api.post<LoginApiResponse>('/auth/login', { userId, password });
      
      // Store token immediately so the profile fetch uses it
      setToken(loginData.token);
      localStorage.setItem('token', loginData.token);

      // Fetch full profile with all fields
      const { data: profileData } = await api.get<AuthUser>('/auth/me');

      setUser(profileData);
      localStorage.setItem('user', JSON.stringify(profileData));
      
      return { user: profileData, token: loginData.token };
    } catch (error: any) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      return null;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setToken(null);
      setTargetUserId(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshProfile, targetUserId, setTargetUserId }}>
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
