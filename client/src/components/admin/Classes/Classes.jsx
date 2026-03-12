import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Plus, Edit, Users, ChevronRight, BookOpen, UserPlus, Upload, Download, Search, GraduationCap, X, Check, ArrowRightLeft, ChevronDown, RefreshCw, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../context/AuthContext';

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classForm, setClassForm] = useState({ id: null, name: '', grade_level: 9 });
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ full_name: '', student_code: '', student_id: '' });
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const fileInputRef = useRef(null);
  const loginFileRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isUpdatingLogins, setIsUpdatingLogins] = useState(false);
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

  const fetchClasses = async () => { try { const res = await api.get('/admin/classes'); setClasses(res.data); } catch { toast.error('Error loading classes'); } };
  const fetchStudents = async (classId) => { try { const res = await api.get(`/admin/students?class_id=${classId}`); setStudents(res.data); setSelectedStudentIds([]); } catch { toast.error("Error loading students"); } };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setIsClassLoading(true);
    try {
      if (classForm.id) { await api.put(`/admin/classes/${classForm.id}`, classForm); toast.success('Class updated', { icon: '✨' }); }
      else { await api.post('/admin/classes', classForm); toast.success('New class added', { icon: '🎉' }); }
      setClassForm({ id: null, name: '', grade_level: 9 });
      fetchClasses();
    } catch { toast.error('Error saving class'); }
    finally { setIsClassLoading(false); }
  };

  const handleClassDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try { await api.delete(`/admin/classes/${id}`); toast.success("Class deleted"); if (selectedClass?.id === id) setSelectedClass(null); fetchClasses(); }
    catch { toast.error("Error deleting class"); }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    setIsStudentLoading(true);
    try {
      await api.post('/admin/students', { ...studentForm, class_id: selectedClass.id });
      toast.success("Student added", { icon: '🎉' });
      setStudentForm({ full_name: '', student_code: '', student_id: '' });
      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch { toast.error("Error saving student"); }
    finally { setIsStudentLoading(false); }
  };

  const handleStudentDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try { await api.delete(`/admin/students/${id}`); toast.success("Student deleted"); fetchStudents(selectedClass.id); fetchClasses(); }
    catch { toast.error("Error deleting student"); }
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
      toast.success("Student updated", { icon: '✨' });
      setEditingStudent(null);
      // If student moved to another class, refresh
      if (editingStudent.class_id !== selectedClass.id) {
        fetchStudents(selectedClass.id);
      } else {
        fetchStudents(selectedClass.id);
      }
      fetchClasses();
    } catch { toast.error("Error updating student"); }
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
      toast.error("Select students and a class");
      return;
    }
    try {
      await api.post('/admin/students/bulk-transfer', { student_ids: selectedStudentIds, target_class_id: parseInt(bulkTargetClassId) });
      toast.success(`${selectedStudentIds.length} students transferred`, { icon: '🎉' });
      setSelectedStudentIds([]);
      setBulkTargetClassId('');
      setShowBulkPanel(false);
      fetchStudents(selectedClass.id);
      fetchClasses();
    } catch { toast.error("Error transferring students"); }
  };

  const handleDownloadSample = () => {
    const wsData = [["Full Name", "Class", "Code"], ["John Doe", "9-A", "1001"], ["Jane Smith", "9-A", "1002"], ["Bob Johnson", "10-B", "1003"]];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 30}, {wch: 15}, {wch: 20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Students_Sample.xlsx");
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
      if (json.length === 0) { toast.error("File is empty"); return; }
      const studentsToImport = json.map(row => {
        const keys = Object.keys(row);
        const nameKey = keys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('ism') || k.toLowerCase().includes('fio'));
        const classKey = keys.find(k => k.toLowerCase().includes('class') || k.toLowerCase().includes('sinf'));
        const loginKey = keys.find(k => k.toLowerCase().includes('code') || k.toLowerCase().includes('login') || k.toLowerCase().includes('kod') || k.toLowerCase().includes('id'));
        return { full_name: row[nameKey || keys[0]], class_name: row[classKey || keys[1]], student_code: row[loginKey || keys[2]] };
      }).filter(s => s.full_name && s.class_name && s.student_code);
      if (studentsToImport.length === 0) { toast.error("Columns do not match (Full Name, Class, Code)"); return; }
      toast.loading(`Importing ${studentsToImport.length} students...`);
      await api.post('/admin/students/import', { students: studentsToImport });
      toast.dismiss(); toast.success("Import successful!");
      fetchClasses(); if (selectedClass) fetchStudents(selectedClass.id);
    } catch { toast.dismiss(); toast.error("Error importing file"); }
    finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // Update logins via Excel (matches student_id -> updates student_code)
  const handleUpdateLogins = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdatingLogins(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      if (json.length === 0) { toast.error("File is empty"); return; }
      const entries = json.map(row => {
        const keys = Object.keys(row);
        const idKey = keys.find(k => k.toLowerCase().includes('id') && !k.toLowerCase().includes('login'));
        const loginKey = keys.find(k => k.toLowerCase().includes('login') || k.toLowerCase().includes('code') || k.toLowerCase().includes('kod'));
        return { student_id: row[idKey || keys[0]]?.toString().trim(), student_code: row[loginKey || keys[1]]?.toString().trim() };
      }).filter(e => e.student_id && e.student_code);
      if (entries.length === 0) { toast.error("Columns not recognized (need ID + Login columns)"); return; }
      toast.loading(`Updating ${entries.length} logins...`);
      const res = await api.post('/admin/students/update-logins', { entries });
      toast.dismiss();
      toast.success(`${res.data.updated} logins updated!`);
      if (res.data.notFound > 0) {
        toast(`${res.data.notFound} IDs not found in database`, { icon: '⚠️' });
      }
      if (selectedClass) fetchStudents(selectedClass.id);
    } catch (err) { toast.dismiss(); toast.error(err.response?.data?.error || "Error updating logins"); }
    finally { setIsUpdatingLogins(false); if (loginFileRef.current) loginFileRef.current.value = ''; }
  };

  const groupedClasses = classes.reduce((acc, cls) => { if (!acc[cls.grade_level]) acc[cls.grade_level] = []; acc[cls.grade_level].push(cls); return acc; }, {});
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const filteredStudents = students.filter(s => searchQuery === '' || s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_code.includes(searchQuery) || (s.student_id && s.student_id.includes(searchQuery)));

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Classes & Students</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage classes, add students, and import via Excel</p>
        </div>
        {user?.role === 'superadmin' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadSample} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center font-semibold shadow-sm gap-2 text-sm">
              <Download className="w-4 h-4" /> Sample
            </button>
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-5 py-2.5 rounded-xl transition-all flex items-center justify-center font-bold shadow-lg shadow-emerald-600/20 gap-2 text-sm">
              <Upload className="w-4 h-4" /> {isImporting ? 'Importing...' : 'Import from Excel'}
            </button>
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={loginFileRef} onChange={handleUpdateLogins} />
            <div className="relative group">
              <button onClick={() => loginFileRef.current?.click()} disabled={isUpdatingLogins} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all flex items-center justify-center font-bold shadow-lg shadow-blue-600/20 gap-2 text-sm">
                <RefreshCw className="w-4 h-4" /> {isUpdatingLogins ? 'Updating...' : 'Update Logins'}
                <Info className="w-3.5 h-3.5 opacity-60" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 text-white text-xs rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-xl">
                <p className="font-bold mb-1">📋 Update Logins via Excel</p>
                <p className="text-slate-300 leading-relaxed">Upload an Excel file with <strong>ID</strong> and <strong>Login</strong> columns. The system will match students by their permanent ID and update their login codes for the new quarter.</p>
                <div className="absolute top-0 right-6 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center"><GraduationCap className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="text-2xl font-black text-slate-900">{classes.length}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Classes</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-emerald-600" /></div>
            <div><p className="text-2xl font-black text-slate-900">{totalStudents}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center"><span className="text-xl font-black text-amber-600">{Object.keys(groupedClasses).length}</span></div>
            <div><p className="text-2xl font-black text-slate-900">Grades</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade Levels</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[550px]">
        {/* LEFT: CLASS LIST */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 flex-shrink-0">
          {user?.role === 'superadmin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 mt-1">
                {classForm.id ? <><Edit className="w-4 h-4 text-indigo-500" /> Edit Class</> : <><Plus className="w-4 h-4 text-indigo-500" /> New Class</>}
              </h2>
              <form onSubmit={handleClassSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grade</label>
                    <input type="number" required min="1" max="11" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium" value={classForm.grade_level} onChange={e => setClassForm({...classForm, grade_level: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Name</label>
                    <input type="text" required placeholder="A" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isClassLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-indigo-600/20">
                    {classForm.id ? <Edit className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} {classForm.id ? 'Save' : 'Add'}
                  </button>
                  {classForm.id && <button type="button" onClick={() => setClassForm({ id: null, name: '', grade_level: 9 })} className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors text-sm font-semibold">Cancel</button>}
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Class List <span className="text-slate-400 font-medium">({classes.length})</span></h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {Object.entries(groupedClasses).sort(([a],[b]) => a-b).map(([grade, gradeClasses]) => (
                <div key={grade}>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">Grade {grade}</div>
                  {gradeClasses.map(cls => (
                    <div key={cls.id} onClick={() => setSelectedClass(cls)}
                      className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedClass?.id === cls.id ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm mr-3 flex-shrink-0 transition-colors ${selectedClass?.id === cls.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>{cls.grade_level}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate text-sm ${selectedClass?.id === cls.id ? 'text-indigo-900' : 'text-slate-800'}`}>{cls.grade_level}-{cls.name}</h4>
                        <p className={`text-xs flex items-center gap-1 mt-0.5 font-medium ${selectedClass?.id === cls.id ? 'text-indigo-600' : 'text-slate-500'}`}><Users className="w-3 h-3" /> {cls.student_count || 0} students</p>
                      </div>
                      {user?.role === 'superadmin' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setClassForm(cls); }} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => handleClassDelete(cls.id, e)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                      {selectedClass?.id === cls.id && <ChevronRight className="w-5 h-5 text-indigo-400 ml-1 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              ))}
              {classes.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No classes added yet</div>}
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
                      Class {selectedClass.grade_level}-{selectedClass.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Total: <span className="font-bold text-slate-700">{students.length}</span> students</p>
                  </div>
                  {user?.role === 'superadmin' && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedStudentIds.length > 0 && (
                        <button onClick={() => setShowBulkPanel(!showBulkPanel)} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${showBulkPanel ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
                          <ArrowRightLeft className="w-4 h-4" /> Move Class ({selectedStudentIds.length})
                        </button>
                      )}
                      <form onSubmit={handleStudentSubmit} className="flex gap-2">
                        <input type="text" required placeholder="ID" className="w-20 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all font-medium" value={studentForm.student_id} onChange={e => setStudentForm({...studentForm, student_id: e.target.value})} />
                        <input type="text" required placeholder="Full Name" className="w-36 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all font-medium" value={studentForm.full_name} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} />
                        <input type="text" required placeholder="Login" className="w-20 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm outline-none transition-all font-medium" value={studentForm.student_code} onChange={e => setStudentForm({...studentForm, student_code: e.target.value})} />
                        <button type="submit" disabled={isStudentLoading} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 flex-shrink-0 font-bold text-sm shadow-lg shadow-indigo-600/20">
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Bulk Transfer Panel */}
                {showBulkPanel && selectedStudentIds.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-amber-800"><ArrowRightLeft className="w-4 h-4 inline mr-1" /> Move {selectedStudentIds.length} students:</span>
                    <div className="relative flex-1 min-w-[200px]">
                      <select value={bulkTargetClassId} onChange={e => setBulkTargetClassId(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none">
                        <option value="">Select Class...</option>
                        {classes.filter(c => c.id !== selectedClass.id).map(c => (
                          <option key={c.id} value={c.id}>{c.grade_level}-{c.name} ({c.student_count || 0} students)</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
                    </div>
                    <button onClick={handleBulkTransfer} disabled={!bulkTargetClassId} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                      <Check className="w-4 h-4" /> Move
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
                    <input type="text" placeholder="Search (name or code)..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                )}
              </div>
              
              {/* Student Table */}
              <div className="flex-1 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 min-h-[250px]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
                    <p className="text-lg font-bold text-slate-500">{searchQuery ? 'No results found' : 'No students found'}</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length} onChange={selectAllStudents} />
                        </th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest w-12">#</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest w-28">Code</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest w-24">ID</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Full Name</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Class</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-slate-500 uppercase tracking-widest text-right w-28">Actions</th>
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
                              {std.student_id ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 font-mono border border-amber-200">{std.student_id}</span>
                              ) : (
                                <span className="text-xs text-slate-300 italic">—</span>
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
                                  <button onClick={saveEditing} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save"><Check className="w-4 h-4" /></button>
                                  <button onClick={cancelEditing} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                user?.role === 'superadmin' && (
                                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditing(std)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleStudentDelete(std.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                )
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
              <h3 className="text-xl font-extrabold text-slate-700 mb-2">No Class Selected</h3>
              <p className="text-sm max-w-sm text-center font-medium">Select a class from the list on the left to manage its students.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classes;
