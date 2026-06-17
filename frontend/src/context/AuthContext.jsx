import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have a stored token, hydrate state
    const storedAdmin = localStorage.getItem('admin_user');
    if (token && storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        // Clear corrupt state
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

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
