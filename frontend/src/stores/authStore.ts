import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_superuser: boolean;
  organization_id?: number | null;
  role?: 'ADMIN' | 'MEMBER' | 'VIEWER' | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,
  
  login: async (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
    await useAuthStore.getState().fetchUser();
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch user", error);
      set({ user: null, isAuthenticated: false, token: null, isLoading: false });
      localStorage.removeItem('token');
    }
  }
}));
