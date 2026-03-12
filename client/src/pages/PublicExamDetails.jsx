import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, DoorOpen, Users, Clock, Calendar, CheckCircle2, AlertCircle, ChevronRight, GraduationCap } from 'lucide-react';
import logo from '../images/logo.png';

const PublicExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tabs: 'rooms', 'classes', 'search'
  const [activeTab, setActiveTab] = useState('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion state
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/public/exam/${id}`);
        setExam(res.data.exam);
        setAssignments(res.data.assignments);
      } catch (err) {
        console.error("Error fetching public exam details:", err);
        setError("Failed to load exam data. It may not exist or may have expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [id]);

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
      (a.full_name && a.full_name.toLowerCase().includes(query))
      // Removed student_code search as public users don't have access to it
    );
  }, [assignments, searchQuery]);

  const getExamStatus = (ex) => {
    if (!ex) return "Endi o'tkaziladi";
    const now = new Date();
    const examDate = new Date(ex.exam_date);
    if (ex.start_time || ex.exam_time) {
      const timeStr = ex.start_time || ex.exam_time;
      const [hours, minutes] = timeStr.split(':');
      examDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      examDate.setHours(23, 59, 59, 999);
    }
    return now > examDate ? "Completed" : "Upcoming";
  };

  const renderError = () => (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3">Exam Not Found</h2>
        <p className="text-slate-500 mb-8 font-medium">We couldn't find the exam you were looking for. It may have been deleted or the link is incorrect.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-schoolDark text-white py-4 rounded-xl font-bold hover:bg-schoolLight transition-colors shadow-lg shadow-schoolDark/30"
        >
          Return to Home Page
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
       <div className="flex flex-col items-center gap-4">
         <div className="w-12 h-12 border-4 border-schoolLight border-t-schoolDark rounded-full animate-spin"></div>
         <p className="text-slate-500 font-bold animate-pulse">Loading exam details...</p>
       </div>
    </div>
  );

  if (error || !exam) {
    return renderError();
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
        {/* HEADER TARGETS */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-schoolDark hover:text-schoolLight transition-colors font-bold text-sm mb-6 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-schoolLight/20 hover:border-schoolLight w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> All Exams
        </button>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-schoolDark"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                 <div className="p-1.5 rounded-xl border-2 border-schoolLight/30 bg-white">
                    <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                 </div>
                 <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{exam.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600 mt-4">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  {new Date(exam.exam_date).toLocaleDateString('ru-RU')}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <Clock className="w-5 h-5 text-amber-500" />
                  {exam.start_time?.slice(0,5) || exam.exam_time?.slice(0,5)}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <Users className="w-5 h-5 text-emerald-500" />
                  Total: {assignments.length}
                </div>
              </div>
            </div>
            <div className={`rounded-2xl p-5 min-w-[150px] text-center border shadow-sm ${getExamStatus(exam) === 'Upcoming' ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'}`}>
               <span className={`block text-[11px] font-black uppercase tracking-widest mb-1.5 ${getExamStatus(exam) === 'Upcoming' ? 'text-amber-600' : 'text-slate-500'}`}>Status</span>
               <span className={`font-black flex items-center justify-center gap-2 text-lg ${getExamStatus(exam) === 'Upcoming' ? 'text-amber-800' : 'text-slate-700'}`}>
                 {getExamStatus(exam) === 'Upcoming' ? <><Clock className="w-5 h-5 text-amber-600"/> Upcoming</> : <><CheckCircle2 className="w-5 h-5 text-slate-500"/> Completed</>}
               </span>
            </div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-20 flex flex-col items-center justify-center shadow-sm">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
               <AlertCircle className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No Assignments Found</h3>
            <p className="text-slate-500 font-medium text-center max-w-md">No students have been assigned to rooms for this exam. Please check back later.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            {/* TABS */}
            <div className="flex border-b border-slate-200 bg-slate-50 items-end px-2 pt-2 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('rooms')}
                className={`flex-1 min-w-[160px] py-4 px-6 text-[15px] font-bold transition-all border-b-[3px] flex justify-center items-center gap-2 rounded-t-xl mx-1 ${activeTab === 'rooms' ? 'border-schoolDark text-schoolDark bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                <DoorOpen className={`w-5 h-5 ${activeTab === 'rooms' ? 'text-schoolDark' : 'text-slate-400'}`} /> Rooms
              </button>
              <button 
                onClick={() => setActiveTab('classes')}
                className={`flex-1 min-w-[160px] py-4 px-6 text-[15px] font-bold transition-all border-b-[3px] flex justify-center items-center gap-2 rounded-t-xl mx-1 ${activeTab === 'classes' ? 'border-schoolDark text-schoolDark bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                <Users className={`w-5 h-5 ${activeTab === 'classes' ? 'text-schoolDark' : 'text-slate-400'}`} /> Classes
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={`flex-1 min-w-[160px] py-4 px-6 text-[15px] font-bold transition-all border-b-[3px] flex justify-center items-center gap-2 rounded-t-xl mx-1 ${activeTab === 'search' ? 'border-schoolDark text-schoolDark bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                <Search className={`w-5 h-5 ${activeTab === 'search' ? 'text-schoolDark' : 'text-slate-400'}`} /> Search
              </button>
            </div>

            <div className="p-6 md:p-8 min-h-[500px] bg-white">
              {/* VIEW 1: BY ROOM */}
              {activeTab === 'rooms' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {Object.entries(groupedByRoom).map(([roomNumber, students]) => (
                    <div key={roomNumber} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all bg-white hover:border-schoolLight/50">
                      <button 
                        onClick={() => setExpandedRoom(expandedRoom === roomNumber ? null : roomNumber)}
                        className="w-full flex items-center justify-between p-5 bg-white hover:bg-schoolLight/5 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-schoolLight/20 to-schoolLight/10 text-schoolDark flex items-center justify-center font-black text-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] border border-schoolLight/30 group-hover:scale-105 transition-transform">
                            {roomNumber}
                          </div>
                          <div className="text-left">
                            <h3 className="font-black text-slate-800 text-lg group-hover:text-schoolDark transition-colors">Room</h3>
                            <p className="text-sm font-bold text-slate-500">{students.length} students</p>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${expandedRoom === roomNumber ? 'bg-schoolDark text-white rotate-90 shadow-schoolLight/30' : 'bg-slate-50 text-slate-400 border border-slate-200 rotate-0 group-hover:bg-schoolLight/10 group-hover:text-schoolDark group-hover:border-schoolLight/30'}`}>
                           <ChevronRight className="w-6 h-6 ml-0.5" />
                        </div>
                      </button>
                      
                      {expandedRoom === roomNumber && (
                        <div className="border-t border-slate-100 bg-slate-50/50 relative">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-schoolLight/20 to-transparent"></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                            {students.sort((a,b) => a.seat_number - b.seat_number).map(student => (
                              <div key={student.assignment_id} className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-schoolLight/40 transition-all relative group flex flex-col h-full">
                                <div className="absolute top-0 right-0 bg-gradient-to-bl from-schoolLight/10 to-white border-b border-l border-schoolLight/20 px-3 py-1.5 rounded-bl-xl rounded-tr-xl font-bold text-schoolDark text-sm shadow-sm z-10">
                                  Seat {student.seat_number}
                                </div>
                                <h4 className="font-bold text-slate-800 text-base pr-14 mb-2" title={student.full_name}>{student.full_name || 'Unknown'}</h4>
                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                  <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold w-fit">
                                    {student.grade_level ? `${student.grade_level}-${student.class_name}` : student.class_name} Class
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
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {Object.entries(groupedByClass).map(([className, students]) => (
                    <div key={className} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all bg-white hover:border-schoolLight/50">
                      <button 
                        onClick={() => setExpandedClass(expandedClass === className ? null : className)}
                        className="w-full flex items-center justify-between p-5 bg-white hover:bg-schoolLight/5 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-black text-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] border border-indigo-200/50 group-hover:scale-105 transition-transform">
                            {className}
                          </div>
                          <div className="text-left">
                            <h3 className="font-black text-slate-800 text-lg group-hover:text-schoolDark transition-colors">Class</h3>
                            <p className="text-sm font-bold text-slate-500">{students.length} students</p>
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${expandedClass === className ? 'bg-schoolDark text-white rotate-90 shadow-schoolLight/30' : 'bg-slate-50 text-slate-400 border border-slate-200 rotate-0 group-hover:bg-schoolLight/10 group-hover:text-schoolDark group-hover:border-schoolLight/30'}`}>
                           <ChevronRight className="w-6 h-6 ml-0.5" />
                        </div>
                      </button>
                      
                      {expandedClass === className && (
                        <div className="border-t border-slate-100 bg-white">
                          <div className="overflow-x-auto p-1">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50/80 border-b-2 border-slate-200">
                                  <th className="py-4 px-6 text-xs font-black text-slate-500 tracking-wider uppercase rounded-tl-xl">Full Name</th>
                                  {/* Student Code Column Removed */}
                                  <th className="py-4 px-6 text-xs font-black text-slate-500 tracking-wider uppercase">Room</th>
                                  <th className="py-4 px-6 text-xs font-black text-slate-500 tracking-wider uppercase rounded-tr-xl">Seat</th>
                                </tr>
                              </thead>
                              <tbody>
                                {students.sort((a,b) => (a.full_name || '').localeCompare(b.full_name || '')).map((student, idx) => (
                                  <tr key={student.assignment_id} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                    <td className="py-4 px-6 font-bold text-slate-800 text-[15px]">{student.full_name || 'Unknown'}</td>
                                    {/* Student Code Cell Removed */}
                                    <td className="py-4 px-6">
                                      <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-black text-sm border border-blue-200 shadow-sm">
                                        <DoorOpen className="w-4 h-4 mr-1.5 opacity-70" /> Room {student.room_number}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center border border-slate-200">
                                         {student.seat_number}
                                      </div>
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
              <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative max-w-3xl mx-auto w-full group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-schoolLight/60 group-focus-within:text-schoolDark transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full px-6 py-5 pl-16 bg-white border-2 border-slate-200 focus:border-schoolDark rounded-2xl shadow-sm focus:ring-4 focus:ring-schoolDark/10 outline-none transition-all text-slate-800 font-bold text-lg placeholder:text-slate-400 placeholder:font-medium block"
                    placeholder="Enter student first or last name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-rose-500 transition-colors font-bold text-sm bg-transparent"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                      <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                         <Search className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="font-extrabold text-xl text-slate-600">No results found</p>
                      <p className="text-sm font-medium text-slate-500 mt-2">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {searchResults.map(student => (
                        <div key={student.assignment_id} className="bg-white border-2 border-schoolLight/20 rounded-2xl p-6 shadow-md relative overflow-hidden group hover:border-schoolLight/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-schoolLight/10 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="flex justify-between items-start mb-4">
                             <div className="bg-schoolDark text-white text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                               {student.grade_level ? `${student.grade_level}-${student.class_name}` : student.class_name} class
                             </div>
                             {/* Student Code Removed Completely */}
                          </div>
                          
                          <h3 className="text-xl font-black text-slate-800 mb-6 line-clamp-2 leading-tight min-h-[56px]" title={student.full_name}>{student.full_name || 'Unknown'}</h3>
                          
                          <div className="grid grid-cols-2 gap-4 mt-auto">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center group-hover:bg-blue-50/50 group-hover:border-blue-200 transition-colors">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5"/> Room</span>
                              <span className="text-2xl font-black text-blue-700">{student.room_number}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center group-hover:bg-schoolLight/10 group-hover:border-schoolLight/30 transition-colors">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Seat</span>
                              <span className="text-2xl font-black text-schoolDark">{student.seat_number}</span>
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
    </div>
  );
};

export default PublicExamDetails;
