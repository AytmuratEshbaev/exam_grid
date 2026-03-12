import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, DoorOpen, CalendarDays, KeySquare, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import logo from '../../../images/logo.png';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/classes', icon: GraduationCap, label: 'Classes' },
    { to: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
    { to: '/admin/exams', icon: CalendarDays, label: 'Exams' },
  ];

  if (user && user.role === 'superadmin') {
    navItems.push({ to: '/admin/users', icon: KeySquare, label: 'Admins' });
  }

  return (
    <div className="w-[260px] bg-slate-950 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 p-1">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">
              <span className="text-indigo-400">Exam</span><span className="text-white">Grid</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-3">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 space-x-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-white/5 mx-3 mb-3">
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-extrabold shadow-md shadow-indigo-500/20">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="text-sm">
              <p className="font-bold truncate max-w-[100px] text-white">{user?.full_name}</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
