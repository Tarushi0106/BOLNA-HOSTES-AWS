import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';

import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import Form from './components/Form';
import LeadDashboard from "./components/LeadDashboard"; 
import LeadList from "./components/LeadList";

import './App.css';



// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token && (location.pathname === '/' || location.pathname === '/signup')) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, location.pathname, navigate]);

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ✅ PUBLIC LEAD FORM (WHATSAPP) */}
      <Route path="/lead-form/:callId" element={<Form />} />

  <Route path="/dashboard/lead/:id" element={<LeadDashboard />} />


      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calls"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/leads" element={<LeadList />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
