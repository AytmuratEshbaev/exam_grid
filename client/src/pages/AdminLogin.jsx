import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, ArrowRight } from 'lucide-react';
import logo from '../images/logo.png';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await login(username, password);
      toast.success('Welcome!', { icon: '🎉' });
      
      // Determine redirect based on role
      if (userData?.user?.role === 'invigilator') {
        navigate('/invigilator');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 mb-4 p-2">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="text-indigo-400">Exam</span>Grid
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">Log in to the admin panel</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3.5 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>Login <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 font-medium">
          For registered administrators only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
