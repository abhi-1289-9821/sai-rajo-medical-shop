import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Verify session with backend refresh endpoint (cookie or token header)
        const response = await API.get('/auth/refresh');
        if (response.data.success) {
          setAdmin(response.data.admin);
          setToken(response.data.token || true);
        } else {
          setAdmin(null);
          setToken(null);
        }
      } catch (err) {
        setAdmin(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (jwtToken, adminData) => {
    if (jwtToken) {
      localStorage.setItem('admin_token', jwtToken);
    }
    setToken(jwtToken || true);
    setAdmin(adminData);
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      console.warn('[AuthContext] Server logout notification failed:', e.message);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setToken(null);
      setAdmin(null);
    }
  };

  const isAuthenticated = !!admin;

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
