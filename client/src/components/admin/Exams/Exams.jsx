import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Plus, Calendar, Settings, CheckSquare, Clock, Users, DoorOpen, List, ChevronDown, CheckCircle2, Shuffle, RotateCcw, ArrowLeft, X } from 'lucide-react';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('classes');
  const [openGrades, setOpenGrades] = useState({});
  const [form, setForm] = useState({ 
    id: null, name: '', exam_date: '', exam_time: '', class_ids: [], room_ids: [], quarter: 1, status: 'scheduled' 
  });

  // Assignment state
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchRooms();
    fetchExams();
  }, []);

  const fetchClasses = async () => { const res = await api.get('/admin/classes'); setClasses(res.data); };
  const fetchRooms = async () => { const res = await api.get('/admin/rooms'); setRooms(res.data); };
  const fetchExams = async () => { const res = await api.get('/admin/exams'); setExams(res.data); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.class_ids.length === 0) { toast.error("Kamida 1 ta sinfni tanlang", { icon: '⚠️' }); setActiveTab('classes'); return; }
    if (form.room_ids.length === 0) { toast.error('Kamida 1 ta xonani belgilang', { icon: '🚪' }); setActiveTab('rooms'); return; }
    try {
      if (form.id) { await api.put(`/admin/exams/${form.id}`, form); toast.success(`"${form.name}" yangilandi`, { icon: '✨' }); }
      else {
        const res = await api.post('/admin/exams', form);
        toast.success(`Imtihon yaratildi va ${res.data.assignment?.total_assigned || 0} ta o'quvchi taqsimlandi!`, { icon: '🎯', duration: 5000 });
      }
      fetchExams(); resetForm();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik yuz berdi', { duration: 6000 }); }
  };

  const resetForm = () => {
    setForm({ id: null, name: '', exam_date: '', exam_time: '', class_ids: [], room_ids: [], quarter: 1, status: 'scheduled' });
    setActiveTab('classes'); setOpenGrades({});
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" imtihonini o'chirmoqchimisiz?`)) return;
    try { await api.delete(`/admin/exams/${id}`); toast.success("Imtihon o'chirildi"); fetchExams(); if(form.id === id) resetForm(); if(selectedExamId === id) closeAssignmentPanel(); }
    catch { toast.error("O'chirishda xatolik"); }
  };

  const toggleClass = (classId) => setForm(prev => ({...prev, class_ids: prev.class_ids.includes(classId) ? prev.class_ids.filter(id => id !== classId) : [...prev.class_ids, classId]}));
  const toggleRoom = (roomId) => setForm(prev => ({...prev, room_ids: prev.room_ids.includes(roomId) ? prev.room_ids.filter(id => id !== roomId) : [...prev.room_ids, roomId]}));

  // --- ASSIGNMENT FUNCTIONS ---
  const openAssignmentPanel = async (examId) => {
    setSelectedExamId(examId);
    setAssignmentLoading(true);
    try {
      const res = await api.get(`/admin/assignments/${examId}`);
      setAssignments(res.data);
    } catch { setAssignments([]); }
    finally { setAssignmentLoading(false); }
  };

  const closeAssignmentPanel = () => {
    setSelectedExamId(null);
    setAssignments([]);
  };

  const handleGenerate = async () => {
    if (!selectedExamId) return;
    setIsAssigning(true);
    try {
      const res = await api.post(`/admin/assignments/generate/${selectedExamId}`);
      toast.success(res.data.message + ` (${res.data.total_assigned} ta)`, { icon: '🎯', duration: 4000 });
      openAssignmentPanel(selectedExamId);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.error || "Taqsimlashda xatolik", { duration: 5000 });
    } finally { setIsAssigning(false); }
  };

  const handleReset = async () => {
    if (!selectedExamId) return;
    if (!window.confirm("Barcha taqsimotni bekor qilmoqchimisiz?")) return;
    try {
      await api.delete(`/admin/assignments/${selectedExamId}/reset`);
      toast.success("Taqsimot bekor qilindi");
      setAssignments([]);
      fetchExams();
    } catch { toast.error("Xatolik"); }
  };

  // Group assignments by room
  const groupedAssignments = assignments.reduce((acc, a) => {
    const key = a.room_number;
    if (!acc[key]) acc[key] = { room_number: key, room_id: a.room_id, capacity: a.capacity, students: [] };
    acc[key].students.push(a);
    return acc;
  }, {});

  const selectedExam = exams.find(e => e.id === selectedExamId);

  // --- IF ASSIGNMENT PANEL IS OPEN ---
  if (selectedExamId && selectedExam) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <button onClick={closeAssignmentPanel} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedExam.name}</h1>
              <p className="text-slate-500 mt-0.5 text-sm font-medium">
                {new Date(selectedExam.exam_date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })} • Soat {selectedExam.exam_time?.slice(0, 5)} • {selectedExam.quarter}-chorak
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {assignments.length > 0 && (
              <button onClick={handleReset} className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm rounded-xl transition-colors flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Bekor qilish
              </button>
            )}
            <button onClick={handleGenerate} disabled={isAssigning} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
              <Shuffle className="w-4 h-4" /> {isAssigning ? 'Taqsimlanmoqda...' : assignments.length > 0 ? 'Qayta taqsimlash' : 'Taqsimlash'}
            </button>
          </div>
        </div>

        {/* INFO CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sinflar</p>
            <p className="text-lg font-black text-slate-900 mt-1">{selectedExam.class_names || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xonalar</p>
            <p className="text-lg font-black text-slate-900 mt-1">{selectedExam.room_names || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">O'quvchilar</p>
            <p className="text-lg font-black text-indigo-600 mt-1">{assignments.length} ta</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Holat</p>
            <span className={`inline-flex items-center px-2.5 py-1 mt-1 text-xs font-extrabold rounded-lg ${selectedExam.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : selectedExam.status === 'done' ? 'bg-slate-50 text-slate-600 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {selectedExam.status === 'active' ? 'Taqsimlangan ✓' : selectedExam.status === 'done' ? 'Tugagan' : 'Kutilmoqda'}
            </span>
          </div>
        </div>

        {/* ASSIGNMENTS CONTENT */}
        {assignmentLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Shuffle className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-700 mb-2">Hali taqsimlanmagan</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 max-w-md text-center">
              Yuqoridagi <strong>"Taqsimlash"</strong> tugmasini bosing. O'quvchilar xonalarga avtomatik ravishda teng taqsimlanadi.
            </p>
            <button onClick={handleGenerate} disabled={isAssigning} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
              <Shuffle className="w-5 h-5" /> Taqsimlashni Boshlash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.values(groupedAssignments).map(room => (
              <div key={room.room_id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-200">
                      {room.room_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{room.room_number}-xona</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{room.students.length} / {room.capacity} o'rin band</p>
                    </div>
                  </div>
                  <div className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${room.students.length >= room.capacity ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {Math.round(room.students.length / room.capacity * 100)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pt-3 pb-1">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${room.students.length >= room.capacity ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (room.students.length / room.capacity) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="p-3">
                  <table className="w-full">
                    <tbody>
                      {room.students.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-1.5 px-2 text-[10px] font-bold text-slate-400 w-6">{i + 1}</td>
                          <td className="py-1.5 px-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{s.student_code}</span>
                          </td>
                          <td className="py-1.5 px-2 text-xs font-semibold text-slate-700 truncate max-w-[140px]" title={s.full_name}>{s.full_name}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span className="text-[10px] font-bold text-indigo-600">{s.grade_level}-{s.class_name}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- MAIN EXAMS VIEW ---
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Imtihonlar markazi</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Barcha imtihonlarni yarating, jarayonni kuzating va xonalarga joylashtiring</p>
        </div>
        {form.id && (
          <button onClick={resetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Yangi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
        {/* LEFT: FORM */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              {form.id ? <><Settings className="w-5 h-5 text-indigo-500" /> Tahrirlash: {form.name}</> : <><Plus className="w-5 h-5 text-indigo-500" /> Yangi Imtihon</>}
            </h2>
            <form id="examForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Imtihon Nomi</label>
                <input required type="text" placeholder="Masalan: 1-Ona tili va adabiyoti" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Sana</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-slate-400" /></div>
                    <input required type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium" value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Vaqt</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock className="h-4 w-4 text-slate-400" /></div>
                    <input required type="time" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium" value={form.exam_time} onChange={e => setForm({...form, exam_time: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Chorak</label>
                  <div className="relative">
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium appearance-none" value={form.quarter} onChange={e => setForm({...form, quarter: e.target.value})}>
                      <option value="1">1-chorak</option><option value="2">2-chorak</option><option value="3">3-chorak</option><option value="4">4-chorak</option><option value="5">Yillik / Yakuniy</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="h-4 w-4 text-slate-400" /></div>
                  </div>
                </div>
                {form.id && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Holat</label>
                    <div className="relative">
                      <select required className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-bold appearance-none ${form.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : form.status === 'done' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="scheduled">Kutilmoqda</option><option value="active">Taqsimlangan (Aktiv)</option><option value="done">Tugagan</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className={`h-4 w-4 ${form.status==='active'?'text-emerald-500':form.status==='done'?'text-slate-400':'text-amber-500'}`} /></div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
          <button type="submit" form="examForm" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-8 py-4 rounded-xl flex items-center justify-center font-bold text-lg gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all transform hover:-translate-y-0.5">
            {form.id ? <CheckCircle2 className="w-6 h-6"/> : <Plus className="w-6 h-6" />} {form.id ? 'Tahrirni Saqlash' : 'Imtihonni Yaratish'}
          </button>
        </div>

        {/* RIGHT: TABS (Classes/Rooms) */}
        <div className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[550px]">
          <div className="flex p-2 bg-slate-50/80 border-b border-slate-100">
            <button type="button" onClick={() => setActiveTab('classes')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === 'classes' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
              <Users className={`w-4 h-4 ${activeTab === 'classes' ? 'text-indigo-500' : ''}`} /> Sinflarni Tanlash
              {form.class_ids.length > 0 && <span className="ml-1.5 bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-[10px]">{form.class_ids.length}</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('rooms')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === 'rooms' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
              <DoorOpen className={`w-4 h-4 ${activeTab === 'rooms' ? 'text-indigo-500' : ''}`} /> Xonalarni Tanlash
              {form.room_ids.length > 0 && <span className="ml-1.5 bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-[10px]">{form.room_ids.length}</span>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
            {/* CLASSES TAB */}
            <div className={`${activeTab === 'classes' ? 'block' : 'hidden'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">Qatnashuvchi sinflar</h3>
                <div className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">Tanlangan: {form.class_ids.length} ta</div>
              </div>
              <div className="flex flex-col gap-4">
                {Object.entries(classes.reduce((acc, curr) => { if (!acc[curr.grade_level]) acc[curr.grade_level] = []; acc[curr.grade_level].push(curr); return acc; }, {})).map(([grade, gradeClasses]) => {
                  const allSelected = gradeClasses.every(c => form.class_ids.includes(c.id));
                  const someSelected = gradeClasses.some(c => form.class_ids.includes(c.id)) && !allSelected;
                  const defaultOpen = someSelected || allSelected;
                  const isOpen = openGrades[grade] !== undefined ? openGrades[grade] : defaultOpen;
                  return (
                    <div key={grade} className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-indigo-200 shadow-sm shadow-indigo-100/50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${isOpen ? 'bg-indigo-50/30' : 'bg-white'}`} onClick={() => setOpenGrades(prev => ({...prev, [grade]: !isOpen}))}>
                        <label className="flex items-center gap-3 cursor-pointer group" onClick={e => e.stopPropagation()}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg transition-colors ${someSelected || allSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>{grade}</div>
                          <div>
                            <span className="font-extrabold text-slate-800 text-base">{grade}-Sinflar</span>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{gradeClasses.length} ta sinf mavjud</p>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected }} onChange={() => setForm(prev => { const ids = gradeClasses.map(c => c.id); return {...prev, class_ids: allSelected ? prev.class_ids.filter(id => !ids.includes(id)) : [...new Set([...prev.class_ids, ...ids])]}; })} />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors">Barchasini belgilash</span>
                          </div>
                        </label>
                        <div className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="p-4 pt-0">
                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {gradeClasses.map(c => {
                                const sel = form.class_ids.includes(c.id);
                                return (
                                  <label key={c.id} className={`relative flex flex-col justify-center items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${sel ? 'bg-indigo-50/50 border-indigo-500 shadow-sm shadow-indigo-100 scale-[0.98]' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                                    <input type="checkbox" className="hidden" checked={sel} onChange={() => toggleClass(c.id)} />
                                    {sel && <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-indigo-500 rounded-full text-white"><CheckSquare className="w-3 h-3" /></div>}
                                    <span className={`text-xl font-black mb-1 ${sel ? 'text-indigo-800' : 'text-slate-700'}`}>{c.name}</span>
                                    <span className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${sel ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{c.student_count || 0} O'quvchi</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {classes.length === 0 && <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl"><Users className="w-10 h-10 mb-3 text-slate-300" /><p className="text-sm font-semibold text-slate-500">Sinflar topilmadi</p></div>}
              </div>
            </div>

            {/* ROOMS TAB */}
            <div className={`${activeTab === 'rooms' ? 'block' : 'hidden'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">Ajratilgan xonalar</h3>
                <div className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">Tanlangan: {form.room_ids.length} ta</div>
              </div>
              <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-xl border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" checked={rooms.length > 0 && rooms.every(r => form.room_ids.includes(r.id))} onChange={() => { const all = rooms.every(r => form.room_ids.includes(r.id)); setForm(prev => ({...prev, room_ids: all ? [] : rooms.map(r => r.id)})); }} />
                  <span className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">Barcha xonalarni tanlash</span>
                  <span className="text-xs text-slate-400 font-medium">({rooms.length} ta xona)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {rooms.map(r => {
                  const sel = form.room_ids.includes(r.id);
                  return (
                    <label key={r.id} className={`relative flex flex-col justify-center items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${sel ? 'bg-blue-50/50 border-blue-500 shadow-sm shadow-blue-100 scale-[0.98]' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                      <input type="checkbox" className="hidden" checked={sel} onChange={() => toggleRoom(r.id)} />
                      {sel && <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white"><CheckSquare className="w-3 h-3" /></div>}
                      <span className={`text-xl font-black mb-1 ${sel ? 'text-blue-800' : 'text-slate-700'}`}>{r.room_number}</span>
                      <span className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${sel ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{r.capacity} O'rin</span>
                    </label>
                  );
                })}
                {rooms.length === 0 && <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl"><DoorOpen className="w-10 h-10 mb-3 text-slate-300" /><p className="text-sm font-semibold text-slate-500">Xonalar topilmadi</p></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXAMS LIST */}
      <div>
        <div className="flex items-center gap-3 mb-6"><List className="w-6 h-6 text-slate-400" /><h2 className="text-xl font-extrabold text-slate-800">Barcha imtihonlar ro'yxati</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${exam.status === 'active' ? 'bg-emerald-500' : exam.status === 'done' ? 'bg-slate-300' : 'bg-amber-400'}`}></div>
              <div className="flex justify-between items-start mb-4 mt-1">
                <span className={`px-2.5 py-1 text-xs rounded-lg font-bold border ${exam.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : exam.status === 'done' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {exam.status === 'scheduled' ? 'Kutilyapti' : exam.status === 'active' ? 'Taqsimlangan ✓' : 'Tugagan'}
                </span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-200">
                  <button onClick={() => { setForm({...exam, exam_date: exam.exam_date.slice(0, 10), class_ids: exam.class_ids || [], room_ids: exam.room_ids || []}); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Tahrirlash" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Settings className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(exam.id, exam.name)} title="O'chirish" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 truncate" title={exam.name}>{exam.name}</h3>
              <p className="text-sm font-bold text-slate-400 mb-6">{exam.quarter}-chorak</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                  <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1"><Calendar className="w-3 h-3 mr-1" /> Sana</div>
                  <div className="text-sm font-bold text-slate-700">{new Date(exam.exam_date).toLocaleDateString('uz-UZ', { day:'2-digit', month:'short' })}</div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">Soat {exam.exam_time?.slice(0, 5)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                  <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1"><Users className="w-3 h-3 mr-1" /> Sinflar</div>
                  <div className="text-xs font-bold text-indigo-700 truncate" title={exam.class_names}>{exam.class_names || '-'}</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1 truncate">{exam.room_ids ? `${exam.room_ids.length} ta xona` : '-'}</div>
                </div>
              </div>
              <button onClick={() => openAssignmentPanel(exam.id)} className="w-full py-3 font-bold rounded-xl border transition-all flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm">
                <Shuffle className="w-4 h-4"/> Taqsimotni Ko'rish
              </button>
            </div>
          ))}
          {exams.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><List className="w-10 h-10 text-slate-300" /></div>
              <p className="text-xl font-extrabold text-slate-700 mb-1">Imtihonlar hali yo'q</p>
              <p className="text-sm font-medium">Yuqoridagi forma orqali yarating.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exams;
