import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { Trash2, Plus, Shield, ShieldCheck, User, Eye, ChevronDown, Lock, AlertTriangle } from 'lucide-react';

const Admins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'admin' });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => { try { const res = await api.get('/admin/admins'); setAdmins(res.data); } catch { toast.error('Error'); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/admins', form);
      toast.success('Admin added', { icon: '🎉' });
      setForm({ username: '', password: '', full_name: '', role: 'admin' });
      fetchAdmins();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete admin "${name}"?`)) return;
    try { await api.delete(`/admin/admins/${id}`); toast.success("Deleted"); fetchAdmins(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-8">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-rose-800 mb-2">Access Denied!</h2>
          <p className="text-rose-600 font-medium">Only Superadmins can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" /> Administrators
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage system admins and add new ones</p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 mt-1">
          <Plus className="w-5 h-5 text-indigo-500" /> New Admin
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input required type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800 text-sm" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Username</label>
            <input required type="text" placeholder="admin_john" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800 text-sm" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input required type="password" placeholder="••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800 text-sm" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
            <div className="relative">
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 text-sm appearance-none" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="admin">Admin</option>
                <option value="invigilator">Invigilator</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-lg shadow-indigo-600/20">
            <Plus className="w-4 h-4"/> Add
          </button>
        </form>
      </div>

      {/* ADMINS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Admin</th>
              <th className="px-6 py-4 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Username</th>
              <th className="px-6 py-4 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 font-bold text-[10px] text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${admin.role === 'superadmin' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                      {admin.full_name?.charAt(0) || 'A'}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{admin.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mono border border-slate-200">{admin.username}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg uppercase tracking-wide ${
                    admin.role === 'superadmin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 
                    admin.role === 'invigilator' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {admin.role === 'superadmin' ? <ShieldCheck className="w-3.5 h-3.5"/> : 
                     admin.role === 'invigilator' ? <Eye className="w-3.5 h-3.5"/> : 
                     <User className="w-3.5 h-3.5"/>}
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {admin.username !== 'admin' && admin.id !== user.id && (
                    <button onClick={() => handleDelete(admin.id, admin.full_name)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <div className="py-16 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-500">No admins found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admins;
