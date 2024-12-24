import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { apiClient } from '@/lib/axios';

type UserData = {
  id: number;
  name?: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  wallet_balance?: number;
  account_type?: 'student' | 'business' | 'professional';
  two_factor_enabled?: boolean;
  preferences?: {
    dark_mode?: boolean;
    theme?: 'light' | 'dark';
  };
  dark_mode?: boolean;
  theme?: 'light' | 'dark';
};

type UserPreferences = {
  dark_mode?: boolean;
  theme?: 'light' | 'dark';
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_notifications?: boolean;
};

type AuthState = {
  user: UserData | null;
  token: string | null;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<UserData>) => Promise<boolean>;
  updateUserPreferences: (preferences: UserPreferences) => Promise<UserData>;
  updateUserType: (type: 'student' | 'business' | 'professional') => Promise<void>;
  refreshToken: () => Promise<UserData | null>;
  initialize: () => Promise<UserData | null>;
  updatePreferences: (preferences: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    marketing_notifications?: boolean;
    profile_visibility?: 'public' | 'private' | 'friends';
    timezone?: string;
    language?: string;
  }) => Promise<UserData>;
};

const useAuthStore = create<AuthState>(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      theme: localStorage.getItem('theme') as 'light' | 'dark' || 'light',
      isAuthenticated: false,

      initialize: async () => {
        console.group('🔍 AuthStore Initialization');
        console.log('Initial State:', {
          token: localStorage.getItem('token'),
          storedTheme: localStorage.getItem('theme'),
          currentStoreTheme: get().theme,
          isAuthenticated: get().isAuthenticated
        });

        const token = localStorage.getItem('token');
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        
        // Explicitly reset authentication if no token
        if (!token) {
          console.log('❌ No token found. Resetting authentication.');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
          console.groupEnd();
          return null;
        }

        try {
          console.log('🌐 Fetching current user with token');
          const userData = await authService.getCurrentUser();
          
          console.log('👤 User Data Received:', userData);

          // Determine theme priority: server > localStorage > default
          const theme = userData.dark_mode ? 'dark' : 'light';
          
          console.log('🎨 Theme Determination:', {
            serverTheme: theme,
            localStorageTheme: storedTheme,
            finalTheme: theme
          });

          // Update localStorage and state
          localStorage.setItem('theme', theme);
          
          set({
            user: {
              ...userData,
              wallet_balance: Number(userData.wallet_balance || 0),
              preferences: {
                dark_mode: userData.dark_mode ?? false,
                theme: theme
              }
            },
            token,
            isAuthenticated: !!token, // Explicitly tie authentication to token
            theme: theme
          });

          console.log('✅ Initialization Complete', {
            user: get().user,
            theme: get().theme,
            isAuthenticated: get().isAuthenticated
          });

          console.groupEnd();
          return userData;
        } catch (error) {
          console.error('❌ Initialization Failed:', error);
          
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
          
          localStorage.removeItem('token');
          console.groupEnd();
          return null;
        }
      },

      setTheme: async (theme: 'light' | 'dark') => {
        try {
          // Update document classes first for immediate visual feedback
          const htmlElement = document.documentElement;
          htmlElement.classList.remove('light', 'dark');
          htmlElement.classList.add(theme);

          // Update local state
          set({ theme });
          localStorage.setItem('theme', theme);

          // Update user preferences in backend - only send dark_mode
          const response = await apiClient.put('/settings/preferences', {
            dark_mode: theme === 'dark'
          });

          // Update user data in store if the API call was successful
          if (response.data.user) {
            set(state => ({
              ...state,
              user: {
                ...state.user,
                ...response.data.user,
                preferences: {
                  ...state.user?.preferences,
                  dark_mode: theme === 'dark'
                }
              }
            }));
          }

        } catch (error) {
          console.error('Failed to update theme:', error);
          
          // Revert changes on failure
          const oldTheme = theme === 'light' ? 'dark' : 'light';
          
          // Revert document classes
          htmlElement.classList.remove('light', 'dark');
          htmlElement.classList.add(oldTheme);
          
          // Revert local state
          set({ theme: oldTheme });
          localStorage.setItem('theme', oldTheme);
          
          throw new Error('Failed to update theme preferences');
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { user, token } = await authService.login({ login: email, password });
          
          // Persist token in localStorage
          localStorage.setItem('token', token);
          
          set({ 
            user, 
            token, 
            isAuthenticated: true,
            theme: user.dark_mode ? 'dark' : 'light'
          });

          // Update theme in localStorage
          localStorage.setItem('theme', user.dark_mode ? 'dark' : 'light');

          // Immediately fetch fresh user data
          await get().initialize();
        } catch (error) {
          console.error('Login failed:', error);
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
          throw error;
        }
      },

      logout: () => {
        // Clear local storage
        localStorage.removeItem('token');
        
        // Reset authentication state
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });

        // Optional: Call backend logout service
        try {
          authService.logout().catch(error => {
            // Silently handle any remaining logout errors
            console.warn('Logout service encountered an issue:', error);
          });
        } catch (error) {
          console.error('Logout attempt failed:', error);
        }
      },

      updateUser: async (userData: Partial<UserData>) => {
        try {
          set(state => ({
            user: state.user ? { ...state.user, ...userData } : null
          }));
          
          // Optionally refresh user data from server
          await get().refreshToken();
          
          return true;
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      },

      updateUserPreferences: async (preferences: UserPreferences) => {
        try {
          const updatedUser = await authService.updateUserPreferences(preferences);
          
          // Merge with existing user data
          set(state => ({
            user: state.user ? { 
              ...state.user, 
              preferences: {
                ...state.user.preferences,
                ...updatedUser.preferences
              }
            } : null,
            theme: updatedUser.preferences?.dark_mode ? 'dark' : 'light'
          }));

          return updatedUser;
        } catch (error) {
          console.error('Store: Error updating user preferences', error);
          throw error;
        }
      },

      updateUserType: async (type: 'student' | 'business' | 'professional') => {
        try {
          const updatedUser = await authService.updateUserType(type);
          
          set(state => ({
            user: state.user ? {
              ...state.user,
              ...updatedUser,
              account_type: type
            } : null
          }));
        } catch (error) {
          console.error('Failed to update user type:', error);
          throw error;
        }
      },

      refreshToken: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            return null;
          }

          const response = await fetch(`${import.meta.env.VITE_API_URL}/user?_=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (!response.ok) {
            get().logout();
            return null;
          }

          const userData = await response.json();

          // Update state with user data directly
          set((state) => ({
            ...state,
            user: userData,  // Store user data directly, not nested
            isAuthenticated: true
          }), true);

          return userData;
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          get().logout();
          return null;
        }
      },

      updatePreferences: async (preferences: {
        email_notifications?: boolean;
        push_notifications?: boolean;
        marketing_notifications?: boolean;
        profile_visibility?: 'public' | 'private' | 'friends';
        timezone?: string;
        language?: string;
      }) => {
        try {
          const response = await apiClient.put('/settings/preferences', preferences);
          set({ user: response.data.user });
          return response.data;
        } catch (error) {
          console.error('Failed to update preferences:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        theme: state.theme,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export { useAuthStore };
export default useAuthStore;