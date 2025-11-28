import { useCallback, useEffect, useState } from 'react';
import { User } from '@shared/api';
import { authApi } from '@/services/api';

const STORAGE_KEY_TOKEN = 'auth_token';
const STORAGE_KEY_USER = 'auth_user';
const STORAGE_KEY_USER_ID = 'userId'; // For API calls

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(() => {
    // Initialize from localStorage
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEY_USER);
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      user,
      token,
      isLoading: false,
      error: null,
    };
  });

  // Validate token on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (token) {
        try {
          setState(prev => ({ ...prev, isLoading: true }));
          const validation = await authApi.validateToken();
          const user = validation.valid ? validation.user : null;
          if (user) {
            setState(prev => ({
              ...prev,
              user,
              token,
              isLoading: false,
            }));
          } else {
            // Token invalid
            clearAuth();
          }
        } catch (err) {
          clearAuth();
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authApi.login({ email, password });

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.user));
      localStorage.setItem(STORAGE_KEY_USER_ID, response.user.id.toString());

      setState({
        user: response.user,
        token: response.token,
        isLoading: false,
        error: null,
      });

      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    role: 'SuperAdmin' | 'HiringManager' | 'Candidate',
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authApi.signup({
        email,
        password,
        role,
        firstName,
        lastName,
      });

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.user));
      localStorage.setItem(STORAGE_KEY_USER_ID, response.user.id.toString());

      setState({
        user: response.user,
        token: response.token,
        isLoading: false,
        error: null,
      });

      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    signup,
    logout,
    clearError,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role?.name === 'SuperAdmin' || state.user?.role?.name === 'HiringManager',
    isCandidate: state.user?.role?.name === 'Candidate',
  };
};

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_USER_ID);
}
