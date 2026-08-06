import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatbot from './components/AIChatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Customer Facing Landing & Order Submission */}
            <Route path="/" element={<Home />} />
            
            {/* Admin Authentication */}
            <Route path="/admin/login" element={<Login />} />
            
            {/* Protected Admin Order Management Dashboard */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Floating AI Assistant Chatbot */}
          <AIChatbot />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
