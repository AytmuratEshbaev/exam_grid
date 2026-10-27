import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentCredentials from '../components/StudentCredentials';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search, DoorOpen, Users, Clock, Calendar, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

const InvigilatorExamDetails = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'rooms', 'classes', 'search'
  const [activeTab, setActiveTab] = useState('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion state
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const [examRes, assignRes] = await Promise.all([
          api.get(`/admin/exams`), // We fetch all exams to find this one, or could make a specialized /exams/:id route. Reusing existing for simplicity
          api.get(`/admin/assignments/${examId}`)
        ]);
        const foundExam = examRes.data.find(e => e.id === parseInt(examId));
        setExam(foundExam);
        setAssignments(assignRes.data);
      } catch (error) {
        console.error("Error fetching exam details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [examId]);

  // Derived Data
  const groupedByRoom = useMemo(() => {
    const groups = {};
    assignments.forEach(a => {
      if (!groups[a.room_number]) groups[a.room_number] = [];
      groups[a.room_number].push(a);
    });
    // Sort rooms
    return Object.fromEntries(Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])));
  }, [assignments]);

  const groupedByClass = useMemo(() => {
    const groups = {};
    assignments.forEach(a => {
      const className = a.grade_level ? `${a.grade_level}-${a.class_name}` : a.class_name;
      if (!groups[className]) groups[className] = [];
      groups[className].push(a);
    });
    // Sort classes
    return Object.fromEntries(Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])));
  }, [assignments]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return assignments;
    const query = searchQuery.toLowerCase();
    return assignments.filter(a => 
      (a.full_name && a.full_name.toLowerCase().includes(query)) ||
      (a.student_code && a.student_code.toLowerCase().includes(query))
    );
  }, [assignments, searchQuery]);

  const getExamStatus = (ex) => {
    if (!ex) return "Upcoming";
    const now = new Date();
    const examDate = new Date(ex.exam_date);
    if (ex.start_time || ex.end_time) {
      const timeStr = ex.start_time || ex.end_time;
      const [hours, minutes] = timeStr.split(':');
      examDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      examDate.setHours(23, 59, 59, 999);
    }
    return now > examDate ? "Completed" : "Upcoming";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-700">Exam Not Found</h2>
        <button onClick={() => navigate('/invigilator')} className="text-indigo-600 hover:underline mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* HEADER */}
      <button 
        onClick={() => navigate('/invigilator')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm mb-6 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> All Exams
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">{exam.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Date: {new Date(exam.exam_date).toLocaleDateString('en-US')}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Clock className="w-5 h-5 text-amber-500" />
                Time: {exam.start_time?.slice(0,5) || exam.exam_time?.slice(0,5)}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Users className="w-5 h-5 text-emerald-500" />
                Total: {assignments.length} students
              </div>
            </div>
          </div>
          <div className={`rounded-2xl p-4 min-w-[140px] text-center border ${getExamStatus(exam) === 'Upcoming' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-200'}`}>
             <span className={`block text-xs font-black uppercase tracking-wider mb-1 ${getExamStatus(exam) === 'Upcoming' ? 'text-amber-500' : 'text-slate-500'}`}>Status</span>
             <span className={`font-bold flex items-center justify-center gap-1.5 ${getExamStatus(exam) === 'Upcoming' ? 'text-amber-700' : 'text-slate-700'}`}>
               {getExamStatus(exam) === 'Upcoming' ? <><Clock className="w-5 h-5"/> Upcoming</> : <><CheckCircle2 className="w-5 h-5"/> Completed</>}
             </span>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Assignments</h3>
          <p className="text-slate-500 text-sm mt-1">Students have not been assigned to rooms for this exam yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* TABS */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 min-w-[160px] py-4 px-6 text-sm font-bold transition-colors border-b-2 flex justify-center items-center gap-2 ${activeTab === 'rooms' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <DoorOpen className="w-4 h-4" /> Rooms
            </button>
            <button 
              onClick={() => setActiveTab('classes')}
              className={`flex-1 min-w-[160px] py-4 px-6 text-sm font-bold transition-colors border-b-2 flex justify-center items-center gap-2 ${activeTab === 'classes' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Users className="w-4 h-4" /> Classes
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex-1 min-w-[160px] py-4 px-6 text-sm font-bold transition-colors border-b-2 flex justify-center items-center gap-2 ${activeTab === 'search' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Search className="w-4 h-4" /> Search Student
            </button>
          </div>

          <div className="p-6 md:p-8 min-h-[400px]">
            {/* VIEW 1: BY ROOM */}
            {activeTab === 'rooms' && (
              <div className="space-y-4">
                {Object.entries(groupedByRoom).map(([roomNumber, students]) => (
                  <div key={roomNumber} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all bg-white">
                    <button 
                      onClick={() => setExpandedRoom(expandedRoom === roomNumber ? null : roomNumber)}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shadow-inner">
                          {roomNumber}
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-800 text-lg">Room</h3>
                          <p className="text-xs font-semibold text-slate-500">{students.length} students</p>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedRoom === roomNumber ? 'bg-indigo-100 text-indigo-600 rotate-90' : 'bg-white text-slate-400 border border-slate-200 rotate-0'}`}>
                         <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                    
                    {expandedRoom === roomNumber && (
                      <div className="border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 bg-slate-50/50 p-2">
                          {students.sort((a,b) => a.seat_number - b.seat_number).map(student => (
                            <div key={student.assignment_id} className="p-3">
                              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-indigo-50 border-b border-l border-indigo-100 px-3 py-1 rounded-bl-xl font-bold text-indigo-700 text-sm shadow-sm">
                                  Seat {student.seat_number}
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm pr-12 line-clamp-1" title={student.full_name}>{student.full_name || 'Unknown'}</h4>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{student.grade_level ? `${student.grade_level}-${student.class_name}` : student.class_name}</span>
                                  <StudentCredentials student={student} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 2: BY CLASS */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                 {Object.entries(groupedByClass).map(([className, students]) => (
                  <div key={className} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all bg-white">
                    <button 
                      onClick={() => setExpandedClass(expandedClass === className ? null : className)}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shadow-inner">
                          {className}
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-800 text-lg">Class</h3>
                          <p className="text-xs font-semibold text-slate-500">{students.length} students</p>
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedClass === className ? 'bg-indigo-100 text-indigo-600 rotate-90' : 'bg-white text-slate-400 border border-slate-200 rotate-0'}`}>
                         <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                    
                    {expandedClass === className && (
                      <div className="border-t border-slate-100">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white border-b border-slate-100">
                                <th className="py-3 px-5 text-xs font-extrabold text-slate-400 tracking-wider">Full Name</th>
                                <th className="py-3 px-5 text-xs font-extrabold text-slate-400 tracking-wider">ID</th>
                                <th className="py-3 px-5 text-xs font-extrabold text-slate-400 tracking-wider">Login</th>
                                <th className="py-3 px-5 text-xs font-extrabold text-slate-400 tracking-wider">Password</th>
                                <th className="py-3 px-5 text-xs font-extrabold text-slate-400 tracking-wider">Room</th>
                                <th className="py-3 px-5 text-xs font-extrabold text-slate-400 tracking-wider">Seat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')).map((student, idx) => (
                                <tr key={student.assignment_id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30'}`}>
                                  <td className="py-3 px-5 font-bold text-slate-800 text-sm">{student.full_name || 'Unknown'}</td>
                                  <td className="py-3 px-5 font-mono text-xs text-slate-700">{student.student_id || '—'}</td>
                                  <td className="py-3 px-5">
                                    <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono text-xs font-bold border border-slate-200">
                                      {student.student_code}
                                    </code>
                                  </td>
                                  <td className="py-3 px-5">
                                    <span className="font-mono text-xs text-slate-700 break-all">{student.student_password || '—'}</span>
                                  </td>
                                  <td className="py-3 px-5">
                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-black text-xs border border-blue-100">
                                      Room {student.room_number}
                                    </span>
                                  </td>
                                  <td className="py-3 px-5 font-bold text-slate-600 text-sm">
                                    {student.seat_number}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: SEARCH */}
            {activeTab === 'search' && (
              <div className="flex flex-col h-full space-y-6">
                <div className="relative max-w-2xl mx-auto w-full group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-4 pl-12 bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-medium text-lg placeholder:text-slate-400"
                    placeholder="Enter student login or name…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {searchResults.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-rose-400 py-12">
                    <AlertCircle className="w-12 h-12 mb-3 opacity-50 text-rose-500" />
                    <p className="font-bold text-slate-700">No results found</p>
                    <p className="text-sm text-slate-500 mt-1">Try searching with a different term.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map(student => (
                      <div key={student.assignment_id} className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                           <div className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                             {student.grade_level ? `${student.grade_level}-${student.class_name}` : student.class_name} Class
                           </div>
                           <StudentCredentials student={student} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-4 line-clamp-2 leading-tight" title={student.full_name}>{student.full_name || 'Unknown'}</h3>
                        
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Room</span>
                            <span className="text-lg font-black text-blue-700">{student.room_number}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Seat</span>
                            <span className="text-lg font-black text-indigo-700">{student.seat_number}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default InvigilatorExamDetails;
