import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import HomePage from './pages/HomePage';
import PublicExamDetails from './pages/PublicExamDetails';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/admin/Layout/AdminLayout';

import Classes from './components/admin/Classes/Classes';
import Rooms from './components/admin/Rooms/Rooms';
import Exams from './components/admin/Exams/Exams';
import Admins from './components/admin/Admins/Admins';

// Invigilator Pages
import InvigilatorLayout from './components/invigilator/Layout/InvigilatorLayout';
import InvigilatorDashboard from './pages/InvigilatorDashboard';
import InvigilatorExamDetails from './pages/InvigilatorExamDetails';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/exam/:id" element={<PublicExamDetails />} />
          
          {/* Admin Routes */}
          <Route path="/login" element={<AdminLogin />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="classes" element={<Classes />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="exams" element={<Exams />} />
            <Route path="users" element={<Admins />} />
            <Route path="assignments/:examId" element={<div className="p-4 text-center">Assignment details coming soon</div>} />
          </Route>
          
          {/* Invigilator Routes */}
          <Route path="/invigilator" element={<InvigilatorLayout />}>
            <Route index element={<InvigilatorDashboard />} />
            <Route path="exam/:examId" element={<InvigilatorExamDetails />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
