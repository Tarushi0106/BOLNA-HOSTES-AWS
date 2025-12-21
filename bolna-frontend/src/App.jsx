// import React, { useEffect } from 'react';
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
//   useNavigate,
//   useLocation
// } from 'react-router-dom';

// import Dashboard from './components/Dashboard';
// import Login from './components/Login';
// import Signup from './components/Signup';
// import Form from './components/Form';
// import LeadDashboard from "./components/LeadDashboard"; 
// import LeadList from "./components/LeadList";
// import MessageLogs from "./components/MessageLogs";


// import './App.css';



// // Protected Route Component
// function ProtectedRoute({ children }) {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     return <Navigate to="/" replace />;
//   }
//   return children;
// }

// function AppContent() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     if (token && (location.pathname === '/' || location.pathname === '/signup')) {
//       navigate('/dashboard', { replace: true });
//     }
//   }, [token, location.pathname, navigate]);

//   return (
// <Routes>
//   {/* PUBLIC ROUTES */}
//   <Route path="/" element={<Login />} />
//   <Route path="/signup" element={<Signup />} />

//   {/* ✅ PUBLIC LEAD FORM */}
//   <Route path="/lead-form/:callId" element={<Form />} />

// {/* <Route path="/lead-form/:callId" element={<LeadForm />} /> */}

//   <Route path="/dashboard/messageLogs" element={<MessageLogs />} />

//   {/* PROTECTED ROUTES */}
//   <Route
//     path="/dashboard"
//     element={
//       <ProtectedRoute>
//         <Dashboard />
//       </ProtectedRoute>
//     }
//   />

//   <Route
//     path="/calls"
//     element={
//       <ProtectedRoute>
//         <Dashboard />
//       </ProtectedRoute>
//     }
//   />

//   <Route path="/dashboard/leads" element={<LeadList />} />

//   {/* 🔥 SPA FALLBACK — DO NOT REDIRECT */}
//   <Route path="*" element={<Form />} />
// </Routes>

//   );
// }

// export default function App() {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// }



import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';
import ThankYou from "./components/ThankYou";

import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import LeadDashboard from "./components/LeadDashboard";

import LeadList from "./components/LeadList";
import MessageLogs from "./components/MessageLogs";

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

      {/* PUBLIC LEAD FORM */}
<Route path="/lead-form/:callId" element={<LeadDashboard />} />


      <Route path="/dashboard/messageLogs" element={<MessageLogs />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
<Route path="/thank-you" element={<ThankYou />} />

      <Route
        path="/calls"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard/leads" element={<LeadList />} />

      {/* SAFE FALLBACK */}
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
