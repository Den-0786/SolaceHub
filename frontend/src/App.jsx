import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
const RegistryConsole = lazy(() => import('./components/RegistryConsole'));
const ChitConsole = lazy(() => import('./pages/ChitConsole'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));

import { DeploymentProvider } from './contexts/DeploymentContext';
import { EventProvider } from './contexts/EventContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAutoLogout } from './hooks/useAutoLogout.js';

const PUBLIC_PATHS = ['/', '/login', '/forgot-password'];

// Force every full page load to start at the homepage. Deep links directly to
// dashboards/consoles (e.g. /owner-dashboard) are bounced to the homepage so the
// login page is always part of the journey. Client-side navigation performed
// after login is unaffected because App mounts only once on load.
function HomepageFirst() {
  const navigate = useNavigate();
  const [redirectToHome] = useState(() => {
    const path = window.location.pathname;
    return !PUBLIC_PATHS.includes(path);
  });

  useEffect(() => {
    if (redirectToHome) {
      navigate('/', { replace: true });
    }
  }, [redirectToHome, navigate]);

  return null;
}

// Signs the user out after 5 minutes without any interaction (mounted while
// authenticated). Runs inside <Router> so it can navigate back to the homepage.
function AutoLogout() {
  useAutoLogout();
  return null;
}

function App() {
  return (
    <EventProvider>
      <DeploymentProvider>
        <Router>
          <HomepageFirst />
          <AutoLogout />
          <Suspense fallback={<div className="min-h-screen bg-indigo-50 flex items-center justify-center">Loading...</div>}>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/registry-console" element={<ProtectedRoute allowedRoles={['desk_operator', 'chit_staff', 'donation_staff']}><RegistryConsole /></ProtectedRoute>} />
            <Route path="/chit-console" element={<ProtectedRoute allowedRoles={['desk_operator', 'chit_staff', 'donation_staff']}><ChitConsole /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['client', 'admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/owner-dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </DeploymentProvider>
    </EventProvider>
  );
}

export default App
