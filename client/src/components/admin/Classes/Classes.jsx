import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Plus, Edit, Users, ChevronRight, BookOpen, UserPlus, Upload, Download, Search, GraduationCap, X, Check, ArrowRightLeft, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [classForm, setClassForm] = useState({ id: null, name: '', grade_level: 9 });
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ full_name: '', student_code: '' });
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit state
  const [editingStudent, setEditingStudent] = useState(null); // { id, full_name, student_code, class_id }
  
  // Bulk transfer state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => {
    if (selectedClass) fetchStudents(selectedClass.id);
    else { setStudents([]); setSelectedStudentIds([]); }
  }, [selectedClass]);

  const fetchClasses = async () => { try { const res = await api.get('/admin/classes'); setClasses(res.data); } catch { toast.error('Sinflarni yuklashda xatolik'); } };
  const fetchStudents = async (classId) => { try { const res = await api.get(`/admin/students?class_id=${classId}`); setStudents(res.data); setSelectedStudentIds([]); } catch { toast.error("O'quvchilarni yuklashda xatolik"); } };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setIsClassLoading(true);
    try {
      if (classForm.id) { await api.put(`/admin/classes/${classForm.id}`, classForm); toast.success('Sinf yangilandi', { icon: '✨' }); }
      else { await api.post('/admin/classes', classForm); toast.success('Yangi sinf qo\'shildi', { icon: '🎉' }); }
      setClassForm({ id: null, name: '', grade_level: 9 });
      fetchClasses();
    } catch { toast.error('Sinfni saqlashda xatolik'); }
    finally { setIsClassLoading(false); }
  };

  const handleClassDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try { await api.delete(`/admin/classes/${id}`); toast.success("Sinf o'chirildi"); if (selectedClass?.id === id) setSelectedClass(null); fetchClasses(); }
    catch { toast.error("O'chirishda xatolik"); }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    setIsStudentLoading(true);
    try {
      await api.post('/admin/students', { ...studentForm, class_id: selectedClass.id });
      toast.success("O'quvchi qo'shildi", { icon: '🎉' });
      setStudentForm({ full_name: '', student_code: '' });
      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch { toast.error("O'quvchini saqlashda xatolik"); }
    finally { setIsStudentLoading(false); }
  };

  const handleStudentDelete = async (id) => {
    if (!window.confirm("O'quvchini o'chirishga aminmisiz?")) return;
    try { await api.delete(`/admin/students/${id}`); toast.success("O'quvchi o'chirildi"); fetchStudents(selectedClass.id); fetchClasses(); }
    catch { toast.error("O'chirishda xatolik"); }
  };

  // --- EDIT STUDENT ---
  const startEditing = (std) => {
    setEditingStudent({ id: std.id, full_name: std.full_name, student_code: std.student_code, class_id: std.class_id });
  };

  const cancelEditing = () => setEditingStudent(null);

  const saveEditing = async () => {
    if (!editingStudent) return;
    try {
      await api.put(`/admin/students/${editingStudent.id}`, editingStudent);
      toast.success("O'quvchi yangilandi", { icon: '✨' });
      setEditingStudent(null);
      // If student moved to another class, refresh
      if (editingStudent.class_id !== selectedClass.id) {
        fetchStudents(selectedClass.id);
      } else {
        fetchStudents(selectedClass.id);
      }
      fetchClasses();
    } catch { toast.error("Yangilashda xatolik"); }
  };

  // --- BULK TRANSFER ---
  const toggleStudentSelect = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const selectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleBulkTransfer = async () => {
    if (selectedStudentIds.length === 0 || !bulkTargetClassId) {
      toast.error("O'quvchilar va sinfni tanlang");
      return;
    }
    try {
      await api.post('/admin/students/bulk-transfer', { student_ids: selectedStudentIds, target_class_id: parseInt(bulkTargetClassId) });
      toast.success(`${selectedStudentIds.length} ta o'quvchi ko'chirildi`, { icon: '🎉' });
      setSelectedStudentIds([]);
      setBulkTargetClassId('');
      setShowBulkPanel(false);
      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch { toast.error("Ko'chirishda xatolik"); }
  };

  const handleDownloadSample = () => {
    const wsData = [["FIO", "Sinf", "Login"], ["Aliyev Vali", "9-A", "1001"], ["Karimova Lola", "9-A", "1002"], ["Raximov Sardor", "10-B", "1003"]];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 30}, {wch: 15}, {wch: 20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "O'quvchilar");
    XLSX.writeFile(wb, "Oquvchilar_Namuna.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      if (json.length === 0) { toast.error("Fayl bo'sh"); return; }
      const studentsToImport = json.map(row => {
        const keys = Object.keys(row);
        const nameKey = keys.find(k => k.toLowerCase().includes('fio') || k.toLowerCase().includes('ism'));
        const classKey = keys.find(k => k.toLowerCase().includes('sinf') || k.toLowerCase().includes('class'));
        const loginKey = keys.find(k => k.toLowerCase().includes('login') || k.toLowerCase().includes('kod') || k.toLowerCase().includes('id'));
        return { full_name: row[nameKey || keys[0]], class_name: row[classKey || keys[1]], student_code: row[loginKey || keys[2]] };
      }).filter(s => s.full_name && s.class_name && s.student_code);
      if (studentsToImport.length === 0) { toast.error("Ustunlar mos kelmadi (FIO, Sinf, Login)"); return; }
      toast.loading(`${studentsToImport.length} ta o'quvchi yuborilmoqda...`);
      await api.post('/admin/students/import', { students: studentsToImport });
      toast.dismiss(); toast.success("Import muvaffaqiyatli!");
      fetchClasses(); if (selectedClass) fetchStudents(selectedClass.id);
    } catch { toast.dismiss(); toast.error("Yuklashda xatolik"); }
    finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const groupedClasses = classes.reduce((acc, cls) => { if (!acc[cls.grade_level]) acc[cls.grade_level] = []; acc[cls.grade_level].push(cls); return acc; }, {});
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const filteredStudents = students.filter(s => searchQuery === '' || s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_code.includes(searchQuery));

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sinflar va O'quvchilar</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Sinflarni boshqaring, o'quvchilarni qo'shing va Excel orqali import qiling</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadSample} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center font-semibold shadow-sm gap-2 text-sm">
            <Download className="w-4 h-4" /> Namuna
          </button>
          <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-5 py-2.5 rounded-xl transition-all flex items-center justify-center font-bold shadow-lg shadow-emerald-600/20 gap-2 text-sm">
            <Upload className="w-4 h-4" /> {isImporting ? 'Yuklanmoqda...' : 'Exceldan import'}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center"><GraduationCap className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="text-2xl font-black text-slate-900">{classes.length}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jami sinflar</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-emerald-600" /></div>
            <div><p className="text-2xl font-black text-slate-900">{totalStudents}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jami o'quvchilar</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center"><span className="text-xl font-black text-amber-600">{Object.keys(groupedClasses).length}</span></div>
            <div><p className="text-2xl font-black text-slate-900">daraja</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sinf darajalari</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[550px]">
        {/* LEFT: CLASS LIST */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 mt-1">
              {classForm.id ? <><Edit className="w-4 h-4 text-indigo-500" /> Tahrirlash</> : <><Plus className="w-4 h-4 text-indigo-500" /> Yangi Sinf</>}
            </h2>
            <form onSubmit={handleClassSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Daraja</label>
                  <input type="number" required min="1" max="11" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium" value={classForm.grade_level} onChange={e => setClassForm({...classForm, grade_level: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nomi</label>
                  <input type="text" required placeholder="A" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isClassLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-indigo-600/20">
                  {classForm.id ? <Edit className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} {classForm.id ? 'Saqlash' : 'Qo\'shish'}
                </button>
                {classForm.id && <button type="button" onClick={() => setClassForm({ id: null, name: '', grade_level: 9 })} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors text-sm font-semibold">Bekor</button>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Sinflar ro'yxati <span className="text-slate-400 font-medium">({classes.length})</span></h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {Object.entries(groupedClasses).sort(([a],[b]) => a-b).map(([grade, gradeClasses]) => (
                <div key={grade}>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">{grade}-Sinflar</div>
                  {gradeClasses.map(cls => (
                    <div key={cls.id} onClick={() => setSelectedClass(cls)}
                      className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedClass?.id === cls.id ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm mr-3 flex-shrink-0 transition-colors ${selectedClass?.id === cls.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>{cls.grade_level}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate text-sm ${selectedClass?.id === cls.id ? 'text-indigo-900' : 'text-slate-800'}`}>{cls.grade_level}-{cls.name}</h4>
                        <p className={`text-xs flex items-center gap-1 mt-0.5 font-medium ${selectedClass?.id === cls.id ? 'text-indigo-600' : 'text-slate-500'}`}><Users className="w-3 h-3" /> {cls.student_count || 0} o'quvchi</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setClassForm(cls); }} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleClassDelete(cls.id, e)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      {selectedClass?.id === cls.id && <ChevronRight className="w-5 h-5 text-indigo-400 ml-1 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              ))}
              {classes.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">Sinflar hali qo'shilmadi</div>}
            </div>
          </div>
        </div>

        {/* RIGHT: STUDENTS */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          {selectedClass ? (
            <>
              {/* Top Bar */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-black">{selectedClass.grade_level}</div>
                      {selectedClass.grade_level}-{selectedClass.name} sinf
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Jami: <span className="font-bold text-slate-700">{students.length} ta</span> o'quvchi</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedStudentIds.length > 0 && (
                      <button onClick={() => setShowBulkPanel(!showBulkPanel)} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${showBulkPanel ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
                        <ArrowRightLeft className="w-4 h-4" /> Sinfini o'zgartirish ({selectedStudentIds.length})
                      </button>
                    )}
                    <form onSubmit={handleStudentSubmit} className="flex gap-2">
                      <input type="text" required placeholder="FIO" className="w-36 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all font-medium" value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} />
                      <input type="text" required placeholder="Kod" className="w-20 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all font-medium" value={studentForm.student_code} onChange={e => setStudentForm({...studentForm, student_code: e.target.value})} />
                      <button type="submit" disabled={isStudentLoading} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 flex-shrink-0 font-bold text-sm shadow-lg shadow-indigo-600/20">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Bulk Transfer Panel */}
                {showBulkPanel && selectedStudentIds.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-amber-800"><ArrowRightLeft className="w-4 h-4 inline mr-1" /> {selectedStudentIds.length} ta o'quvchini ko'chirish:</span>
                    <div className="relative flex-1 min-w-[200px]">
                      <select value={bulkTargetClassId} onChange={e => setBulkTargetClassId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none">
                        <option value="">Sinf tanlang...</option>
                        {classes.filter(c => c.id !== selectedClass.id).map(c => (
                          <option key={c.id} value={c.id}>{c.grade_level}-{c.name} ({c.student_count || 0} o'quvchi)</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
                    </div>
                    <button onClick={handleBulkTransfer} disabled={!bulkTargetClassId} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                      <Check className="w-4 h-4" /> Ko'chirish
                    </button>
                    <button onClick={() => { setShowBulkPanel(false); setSelectedStudentIds([]); }} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Search */}
                {students.length > 3 && (
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Qidiruv (ism yoki kod)..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                )}
              </div>
              
              {/* Student Table */}
              <div className="flex-1 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 min-h-[250px]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
                    <p className="text-lg font-bold text-slate-500">{searchQuery ? 'Natija topilmadi' : 'Hozircha o\'quvchilar yo\'q'}</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length} onChange={selectAllStudents} />
                        </th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest w-12">#</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest w-28">Kod</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Ism-Familiya</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Sinfi</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest text-right w-28">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {filteredStudents.map((std, idx) => {
                        const isEditing = editingStudent?.id === std.id;
                        const isSelected = selectedStudentIds.includes(std.id);
                        return (
                          <tr key={std.id} className={`transition-colors group ${isEditing ? 'bg-indigo-50/50' : isSelected ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}`}>
                            <td className="px-4 py-3">
                              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={isSelected} onChange={() => toggleStudentSelect(std.id)} />
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input type="text" className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" value={editingStudent.student_code} onChange={e => setEditingStudent({...editingStudent, student_code: e.target.value})} />
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mono border border-slate-200">{std.student_code}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input type="text" className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} />
                              ) : (
                                <span className="font-semibold text-sm text-slate-700">{std.full_name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="relative">
                                  <select className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none" value={editingStudent.class_id} onChange={e => setEditingStudent({...editingStudent, class_id: parseInt(e.target.value)})}>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.grade_level}-{c.name}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 pointer-events-none" />
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">{selectedClass.grade_level}-{selectedClass.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-1">
                                  <button onClick={saveEditing} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Saqlash"><Check className="w-4 h-4" /></button>
                                  <button onClick={cancelEditing} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Bekor qilish"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEditing(std)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Tahrirlash"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleStudentDelete(std.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="O'chirish"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 bg-slate-50/30 min-h-[400px]">
              <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6 text-indigo-200"><BookOpen className="w-12 h-12" /></div>
              <h3 className="text-xl font-extrabold text-slate-700 mb-2">Sinf tanlanmadi</h3>
              <p className="text-sm max-w-sm text-center font-medium">Chap tomondagi ro'yxatdan sinfni tanlang va shu sinfga tegishli o'quvchilarni boshqaring</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classes;
