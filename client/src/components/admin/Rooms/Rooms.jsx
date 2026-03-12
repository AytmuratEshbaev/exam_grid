import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Plus, DoorOpen, Users, Settings, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Rooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ id: null, room_number: '', capacity: 12 });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const res = await api.get('/admin/rooms');
    setRooms(res.data);
  };

  const resetForm = () => setForm({ id: null, room_number: '', capacity: 12 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/admin/rooms/${form.id}`, form);
        toast.success(`Room "${form.room_number}" updated`, { icon: '✨' });
      } else {
        await api.post('/admin/rooms', form);
        toast.success(`Room "${form.room_number}" added`, { icon: '🎉' });
      }
      resetForm();
      fetchRooms();
    } catch (error) {
      toast.error("Error: Room number might already exist");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete room "${name}"?`)) return;
    try {
      await api.delete(`/admin/rooms/${id}`);
      toast.success("Room deleted");
      fetchRooms();
      if(form.id === id) resetForm();
    } catch (e) {
      toast.error('Error');
    }
  };

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Room Management</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Create exam rooms and set their capacity</p>
        </div>
        {user?.role === 'superadmin' && form.id && (
          <button onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <DoorOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{rooms.length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Rooms</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{totalCapacity}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Capacity</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <span className="text-xl font-black text-amber-600">{rooms.length > 0 ? Math.round(totalCapacity / rooms.length) : 0}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">average</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Room Capacity</p>
            </div>
          </div>
        </div>
      </div>

      {/* FORM */}
      {user?.role === 'superadmin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            {form.id ? <><Settings className="w-5 h-5 text-blue-500" /> Edit: {form.room_number}</> : <><Plus className="w-5 h-5 text-blue-500" /> New Room</>}
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Room Name / Number</label>
              <input 
                type="text" required 
                placeholder="E.g. 101" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" 
                value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} 
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Room Capacity</label>
              <input 
                type="number" required min="1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800" 
                value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 0})} 
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {form.id && (
                <button type="button" onClick={resetForm} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl flex items-center justify-center font-bold gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all"
              >
                {form.id ? <CheckCircle2 className="w-5 h-5"/> : <Plus className="w-5 h-5" />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROOMS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
            
            <div className="flex justify-between items-start mb-4 mt-1">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <DoorOpen className="w-7 h-7 text-blue-600" />
              </div>
              {user?.role === 'superadmin' && (
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-200">
                  <button onClick={() => { setForm(room); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(room.id, room.room_number)} title="Delete" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-1">Room {room.room_number}</h3>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-slate-700">{room.capacity} seats</span>
              </div>
            </div>
          </div>
        ))}
        
        {rooms.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <DoorOpen className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-xl font-extrabold text-slate-700 mb-1">No rooms added yet</p>
            <p className="text-sm font-medium">Use the form above to add a new room</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
