import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedAdmin = localStorage.getItem('admin_user');
      if (token && storedAdmin) {
        try {
          // Verify with backend session refresh endpoint
          const response = await API.get('/auth/refresh');
          if (response.data.success) {
            localStorage.setItem('admin_token', response.data.token);
            setToken(response.data.token);
            setAdmin(response.data.admin);
          } else {
            logout();
          }
        } catch (err) {
          console.error('[AuthContext] Session hydration verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = (jwtToken, adminData) => {
    localStorage.setItem('admin_token', jwtToken);
    localStorage.setItem('admin_user', JSON.stringify(adminData));
    setToken(jwtToken);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setAdmin(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ admin, token, isAuthenticated, login, logout, loading }}>
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
