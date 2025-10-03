import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest, RegisterCompanyRequest } from '../types';
import { authApi, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  registerCompany: (userData: RegisterCompanyRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthResponse }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      // Evitar cargar perfil de usuario (tenant) en rutas de SuperAdmin
      try {
        const path = window.location.pathname;
        if (path.startsWith('/superadmin')) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      } catch {}

      const token = getAuthToken();
      const refreshToken = localStorage.getItem('drokex_refresh_token');

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await authApi.getProfile();
        if (response.data.success && response.data.data) {
          // Autenticado: puede provenir de token en header (localStorage) o cookie (impersonación)
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data,
              token: token || '',
              refreshToken: refreshToken || '',
              expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
          });
        } else if (token) {
          // Teníamos token pero perfil falló → limpiar
          removeAuthToken();
        }
      } catch (error) {
        if (token) removeAuthToken();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authApi.login(credentials);
      
      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        
        setAuthToken(authData.token);
        localStorage.setItem('drokex_refresh_token', authData.refreshToken);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
      } else {
        dispatch({ 
          type: 'LOGIN_FAILURE', 
          payload: response.data.message || 'Login failed' 
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0] || 
                          'An error occurred during login';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authApi.register(userData);
      
      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        
        setAuthToken(authData.token);
        localStorage.setItem('drokex_refresh_token', authData.refreshToken);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
      } else {
        dispatch({ 
          type: 'LOGIN_FAILURE', 
          payload: response.data.message || 'Registration failed' 
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0] || 
                          'An error occurred during registration';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  };

  const registerCompany = async (userData: RegisterCompanyRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      // Usar endpoint dedicado de registro de empresa (atómico)
      const response = await authApi.registerCompany(userData as any);

      if (response.data.success && response.data.data) {
        const authData = response.data.data;

        setAuthToken(authData.token);
        localStorage.setItem('drokex_refresh_token', authData.refreshToken);

        dispatch({ type: 'LOGIN_SUCCESS', payload: authData });
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: response.data.message || 'Company registration failed'
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.errors?.[0] ||
                          'An error occurred during company registration';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('drokex_refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      removeAuthToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    registerCompany,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
