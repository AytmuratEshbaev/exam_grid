import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Users, DoorOpen, ChevronRight, Clock } from 'lucide-react';

const InvigilatorDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getExamStatus = (exam) => {
    if (!exam) return "Upcoming";
    const now = new Date();
    const examDate = new Date(exam.exam_date);
    if (exam.start_time || exam.end_time) {
      const timeStr = exam.start_time || exam.end_time;
      const [hours, minutes] = timeStr.split(':');
      examDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      examDate.setHours(23, 59, 59, 999);
    }
    return now > examDate ? "Completed" : "Upcoming";
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/admin/exams');
        const sortedExams = res.data.sort((a, b) => {
          const statusA = getExamStatus(a);
          const statusB = getExamStatus(b);
          if (statusA === statusB) {
            return new Date(a.exam_date) - new Date(b.exam_date);
          }
          return statusA === "Upcoming" ? -1 : 1;
        });
        setExams(sortedExams);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Available Exams</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Select one of the exams below to manage</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 flex flex-col items-center justify-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Exams</h3>
          <p className="text-slate-500 text-sm mt-1">There are no active exams in the system currently.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div 
              key={exam.id}
              onClick={() => navigate(`/invigilator/exam/${exam.id}`)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 p-6 flex flex-col transition-all cursor-pointer group hover:-translate-y-1 overflow-hidden relative"
            >
               {/* Top accent line */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getExamStatus(exam) === 'Upcoming' ? 'from-amber-400 to-orange-500' : 'from-slate-400 to-slate-500'}`}></div>
              
              <div className="flex justify-between items-start mb-4 mt-1">
                <span className={`px-2.5 py-1 text-xs rounded-lg font-bold border ${getExamStatus(exam) === 'Upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {getExamStatus(exam)}
                </span>
                
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2">{exam.name}</h3>
              <p className="text-sm font-bold text-slate-400 mb-6">Term {exam.quarter}</p>

              <div className="space-y-3 mt-auto">
                <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Date: {new Date(exam.exam_date).toLocaleDateString('en-US')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Time: {exam.start_time?.slice(0, 5) || exam.exam_time?.slice(0, 5)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{exam.class_ids?.length || 0} classes</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <DoorOpen className="w-4 h-4 text-slate-400" />
                    <span>{exam.room_ids?.length || 0} rooms</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvigilatorDashboard;
