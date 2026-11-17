import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('truthlens_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('truthlens_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  // Validate session on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('truthlens_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifySession();

    // Listen for global auth expired events
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('truthlens_token', data.token);
    localStorage.setItem('truthlens_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data;
  };

  const register = async (name, email, password, role = 'user') => {
    const data = await authService.register(name, email, password, role);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('truthlens_token', data.token);
    localStorage.setItem('truthlens_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('truthlens_token');
    localStorage.removeItem('truthlens_user');
  };

  const updateProfile = async (updates) => {
    const data = await authService.updateProfile(updates);
    setUser(data.user);
    localStorage.setItem('truthlens_user', JSON.stringify(data.user));
    return data;
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
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

export default AuthContext;

