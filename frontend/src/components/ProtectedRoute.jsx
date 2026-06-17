import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 border-4 border-medical-200 border-t-medical-600 rounded-full animate-spin"></div>
          <p class="text-slate-500 font-medium animate-pulse-subtle">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
