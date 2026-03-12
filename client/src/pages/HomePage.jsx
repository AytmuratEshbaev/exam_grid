import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';
import { FaGraduationCap } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../images/logo.png';

const HomePage = () => {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodayExams();
  }, []);

  const fetchTodayExams = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/public/today-exams');
      setExams(res.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError("Failed to load exams.");
    } finally {
      setIsLoading(false);
    }
  };

  const getExamStatus = (ex) => {
    if (!ex) return "Upcoming";
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

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center">
      {/* Background decorations - Modified to #0f0070 */}
      <div className="absolute top-0 left-0 w-full h-[450px] bg-schoolDark transform -skew-y-3 origin-top-left z-0 shadow-2xl"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-schoolLight/20 via-transparent to-transparent z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-6 md:py-10 flex flex-col items-center">
        
        {/* Top Navigation - Login Button */}
        <div className="w-full flex justify-end mb-4">
          <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2 rounded-xl font-bold transition-all shadow-sm backdrop-blur-sm flex items-center gap-2">
            Login <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Header - School Branding */}
        <div className="text-center mb-16 w-full flex flex-col items-center">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center p-4 shadow-xl mb-6 border-4 border-schoolLight/30">
            <img src={logo} alt="School Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md mb-3 px-4 max-w-4xl leading-tight">
            Nukus Branch of the specialized school named after Muhammad al-Khorezmi
          </h1>
          <div className="h-1 w-24 bg-white/30 rounded-full mb-6"></div>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium bg-schoolDark/40 px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">
            Exam Schedule and Room Assignment Portal
          </p>
        </div>

        {error && (
          <div className="w-full max-w-2xl bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center mb-8 font-medium">
            {error}
          </div>
        )}

        {isLoading && exams.length === 0 && (
           <div className="flex justify-center my-12">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
           </div>
        )}

        {/* Today's Exams */}
        {!isLoading && (
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="bg-amber-100 text-amber-600 p-2 rounded-lg mr-3">
                <Calendar className="w-5 h-5" />
              </span>
              Exams
            </h2>
            
            {exams.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md border border-slate-100">
                <p className="text-slate-500 text-lg">No active exams found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map(exam => {
                  const status = getExamStatus(exam);
                  const isUpcoming = status === "Upcoming";
                  
                  return (
                    <Link key={exam.id} to={`/exam/${exam.id}`} className="block group">
                      <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-100 hover:border-indigo-300 transition-all duration-300 h-full flex flex-col relative overflow-hidden group-hover:-translate-y-1">
                        
                        {/* Top Accent Line */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isUpcoming ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-schoolDark'}`}></div>

                        <div className="flex justify-between items-start mb-5 pt-2">
                          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm ${
                            isUpcoming 
                              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-700' 
                              : 'bg-schoolDark text-white border-schoolLight'
                          }`}>
                            {isUpcoming ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span className="text-xs font-black uppercase tracking-widest">{isUpcoming ? 'Upcoming' : 'Completed'}</span>
                          </div>
                          
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200">
                            {exam.exam_time.slice(0, 5)}
                          </span>
                        </div>
                        
                        <h3 className="font-extrabold text-xl text-slate-800 line-clamp-2 mb-4 group-hover:text-schoolDark transition-colors leading-tight">
                          {exam.name}
                        </h3>
                        
                        <div className="flex-1 space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                            <div className="flex items-center text-sm font-medium text-slate-600">
                              <Calendar className="w-4 h-4 text-schoolLight mr-2.5" />
                              <span className="text-slate-900 font-bold">{new Date(exam.exam_date).toLocaleDateString('en-US')}</span>
                           </div>
                           <div className="flex items-center text-sm font-medium text-slate-600">
                              <div className="w-4 h-4 rounded bg-schoolDark/10 text-schoolDark flex items-center justify-center font-black text-[10px] mr-2.5 border border-schoolDark/20">
                                C
                              </div>
                              <span className="text-slate-900 font-bold truncate" title={exam.class_name}>
                                {exam.class_name ? exam.class_name.split(',').length + ' classes' : 'Classes'}
                              </span>
                           </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-schoolDark font-bold text-sm">
                          <span>View Details</span>
                          <div className="w-8 h-8 rounded-full bg-schoolLight/10 flex items-center justify-center group-hover:bg-schoolDark group-hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4 ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default HomePage;
