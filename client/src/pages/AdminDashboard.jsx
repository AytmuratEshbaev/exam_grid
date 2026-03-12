import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, DoorOpen, BookOpen, CalendarDays, GraduationCap, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, rooms: 0, exams: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clsRes, rmRes, exmRes] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/rooms'),
          api.get('/admin/exams')
        ]);
        setStats({
          classes: clsRes.data.length,
          students: clsRes.data.reduce((sum, c) => sum + (c.student_count || 0), 0),
          rooms: rmRes.data.length,
          exams: exmRes.data.length
        });
      } catch (error) {
        console.error("Dashboard stats error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Classes", value: stats.classes, icon: GraduationCap, gradient: "from-indigo-500 to-purple-600", shadow: "shadow-indigo-500/20", link: "/admin/classes" },
    { title: "Students", value: stats.students, icon: Users, gradient: "from-emerald-500 to-green-600", shadow: "shadow-emerald-500/20", link: "/admin/classes" },
    { title: "Rooms", value: stats.rooms, icon: DoorOpen, gradient: "from-blue-500 to-cyan-600", shadow: "shadow-blue-500/20", link: "/admin/rooms" },
    { title: "Exams", value: stats.exams, icon: CalendarDays, gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", link: "/admin/exams" }
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Dashboard</h1>
        <p className="text-slate-500 mt-2 font-medium">Quick overview of ExamGrid system status and data.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(card.link)}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`bg-gradient-to-br ${card.gradient} p-3.5 rounded-xl text-white shadow-lg ${card.shadow}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-200">
                <ArrowUpRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{card.title}</p>
              <h3 className="text-4xl font-black text-slate-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      {user?.role === 'superadmin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-extrabold text-slate-800">Quick Links</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Add New Class", to: "/admin/classes", color: "from-indigo-600 to-indigo-700", icon: GraduationCap },
              { label: "Add Room", to: "/admin/rooms", color: "from-blue-600 to-blue-700", icon: DoorOpen },
              { label: "Create Exam", to: "/admin/exams", color: "from-emerald-600 to-emerald-700", icon: CalendarDays },
              { label: "Manage Classes", to: "/admin/classes", color: "from-purple-600 to-purple-700", icon: BookOpen }
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.to)}
                className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all`}
              >
                <action.icon className="w-5 h-5 flex-shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
