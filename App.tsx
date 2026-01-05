import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Curriculum from './pages/Curriculum';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import GradeManagement from './pages/GradeManagement';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import ClassCouncil from './pages/ClassCouncil';
import Settings from './pages/Settings';
import Users from './pages/Users';
import { hasPermission } from './lib/permissions';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useSchool();
  const location = useLocation();

  if (!currentUser) return <Login />;

  if (!hasPermission(currentUser.role, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AuthenticatedApp: React.FC = () => {
  const { currentUser } = useSchool();

  if (!currentUser) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/curriculum" element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
        <Route path="/grades" element={<ProtectedRoute><GradeManagement /></ProtectedRoute>} />
        <Route path="/council" element={<ProtectedRoute><ClassCouncil /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <SchoolProvider>
      <AuthenticatedApp />
    </SchoolProvider>
  );
};

export default App;