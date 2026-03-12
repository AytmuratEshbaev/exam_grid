import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../../context/AuthContext';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile (Overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl transition-transform transform translate-x-0" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
