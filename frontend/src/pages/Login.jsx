import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Lock, User, AlertCircle, Eye, EyeOff, Activity } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validations
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/auth/login', {
        username: username.trim(),
        password: password
      });

      if (response.data.success) {
        login(response.data.token, response.data.admin);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(response.data.message || 'Authentication failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Unable to connect to the server. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 rounded-full bg-medical-100/40 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-teal-100/40 blur-3xl"></div>

      <div className="max-w-md w-full animate-fade-in relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-medical-500 to-medical-600 rounded-2xl text-white shadow-lg shadow-medical-200 mb-3 transform hover:rotate-12 transition-transform duration-300">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-sans">
            SAI RAJO MEDICAL HALL
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administrative Control Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl shadow-xl p-8 border border-white/60">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Sign In
          </h2>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-2.5">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input pl-10"
                  placeholder="Enter admin username"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10 pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-6 text-sm font-semibold tracking-wide py-3.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-medical-600 transition-colors"
          >
            &larr; Back to Pharmacy Customer Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
