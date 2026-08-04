import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const RegistryConsole = lazy(() => import('./components/RegistryConsole'));
const ChitConsole = lazy(() => import('./pages/ChitConsole'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));

import { DeploymentProvider } from './contexts/DeploymentContext';
import { EventProvider } from './contexts/EventContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <EventProvider>
      <DeploymentProvider>
        <Router>
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
