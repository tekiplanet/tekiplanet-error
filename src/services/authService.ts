import { apiClient } from '@/lib/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface LoginData {
  login: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  first_name?: string;
  last_name?: string;
  type: 'student' | 'business' | 'professional';
}

interface UserData {
  id: number;
  username: string;
  email: string;
  type: 'student' | 'business' | 'professional';
  first_name?: string;
  last_name?: string;
  wallet_balance?: number;
  two_factor_enabled?: boolean;
  dark_mode?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_notifications?: boolean;
}

interface User {
  // Add properties of the User type
}

interface UserPreferences {
  dark_mode?: boolean;
  theme?: 'light' | 'dark';
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_notifications?: boolean;
}

interface LoginResponse {
  token?: string;
  user?: UserData;
  requires_2fa?: boolean;
  message?: string;
}

export const authService = {
  async login(credentials: { login: string; password: string; code?: string }): Promise<LoginResponse> {
    try {
      // Validate input
      if (!credentials || !credentials.login || !credentials.password) {
        throw new Error('Invalid login credentials');
      }

      const response = await apiClient.post<LoginResponse>('login', credentials);
      
      console.log('Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        first_name: data.first_name,
        last_name: data.last_name,
        type: data.type
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const responseData = await response.json();
    return responseData.user; // Return the user data directly
  },

  async logout() {
    try {
      const token = this.getToken();
      
      // If no token, consider logout successful
      if (!token) {
        return { message: 'Already logged out' };
      }

      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // If unauthorized, it might mean the token is already invalid
      if (response.status === 401) {
        console.warn('Logout request received 401 - Token might be already invalid');
        return { message: 'Token already invalid' };
      }

      // For other non-OK responses
      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Logout failed:', errorData);
        return { message: errorData.message || 'Logout failed' };
      }

      return response.json();
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure we always return something, even on error
      return { message: 'Logout failed due to network error' };
    }
  },

  getCurrentUser(): Promise<UserData> {
    const token = localStorage.getItem('token');
    console.group('🔍 getCurrentUser');
    console.log('Token from localStorage:', token);

    if (!token) {
      console.error('❌ No authentication token found');
      console.groupEnd();
      throw new Error('No authentication token found');
    }

    return fetch(`${API_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(async (response) => {
      console.log('Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch user data:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        throw new Error(errorText || 'Failed to fetch user data');
      }

      try {
        const userData = await response.json();
        console.log('👤 Raw User Data:', userData);

        const processedUserData = {
          ...userData,
          wallet_balance: Number(userData.wallet_balance || 0),
          two_factor_enabled: userData.two_factor_enabled === 1 || userData.two_factor_enabled === true,
          preferences: {
            dark_mode: userData.dark_mode ?? false,
            theme: userData.dark_mode ? 'dark' : 'light'
          }
        };

        console.log('✅ Processed User Data:', processedUserData);
        console.groupEnd();

        return processedUserData;
      } catch (parseError) {
        console.error('❌ JSON Parsing Error:', parseError);
        console.groupEnd();
        throw new Error('Failed to parse user data');
      }
    }).catch((error) => {
      console.error('❌ getCurrentUser Error:', error);
      console.groupEnd();
      throw error;
    });
  },

  getToken() {
    let token: string | null = null;

    // 1. Check localStorage
    token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);

    // 2. Check Zustand store
    if (!token) {
      const storedState = localStorage.getItem('auth-storage');
      console.log('Stored state:', storedState);

      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          console.log('Parsed state:', parsedState);
          
          // Try multiple paths to find the token
          token = parsedState?.token || 
                  parsedState?.state?.token || 
                  parsedState?.state?.user?.token;
          
          console.log('Token from parsed state:', token);
        } catch (parseError) {
          console.error('Error parsing stored state:', parseError);
        }
      }
    }

    // 3. Fallback check for window or global object (if applicable)
    if (!token && (window as any).token) {
      token = (window as any).token;
      console.log('Token from window object:', token);
    }

    return token;
  },

  async updateUserPreferences(preferences: UserPreferences): Promise<UserData> {
    const token = this.getToken();
    
    if (!token) {
      console.error('No authentication token available');
      throw new Error('No authentication token');
    }

    // Map theme to dark_mode
    const mappedPreferences = {
      ...preferences,
      dark_mode: preferences.theme === 'dark' ? true : false
    };
    delete mappedPreferences.theme;

    try {
      const response = await fetch(`${API_URL}/user/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(mappedPreferences)
      });

      console.log('Updating preferences with token:', token);
      console.log('Mapped Preferences:', mappedPreferences);

      // Parse response body once
      const responseBody = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to update preferences';
        try {
          const errorData = JSON.parse(responseBody);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = responseBody || errorMessage;
        }

        console.error('Preference update error:', {
          status: response.status,
          message: errorMessage
        });

        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = JSON.parse(responseBody);
      console.log('Preference update response:', data);
      
      return data.user || data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  updateUserType: async (type: 'student' | 'business' | 'professional'): Promise<UserData> => {
    try {
      const response = await fetch(`${API_URL}/user/type`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ account_type: type })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user type');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error updating user type:', error);
      throw error;
    }
  },
};
