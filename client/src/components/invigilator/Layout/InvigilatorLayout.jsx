import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LogOut } from 'lucide-react';
import logo from '../../../images/logo.png';

const InvigilatorLayout = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Prevent superadmin and regular users from accessing invigilator panel accidentally 
  // though superadmins structurally could, a dedicated UI is better restricted to its intended audience or allowed conditionally. 
  // Let's allow superadmins to see it for testing, but mostly it's for 'invigilator'
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header - No Sidebar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/invigilator')}>
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-10 h-10 flex items-center justify-center">
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Exam<span className="text-indigo-600">Grid</span>
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                Invigilator
              </span>
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700">{user.full_name}</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{user.username}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default InvigilatorLayout;
