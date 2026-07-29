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

function App() {
  return (
    <DeploymentProvider>
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-indigo-50 flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/registry-console" element={<RegistryConsole />} />
            <Route path="/chit-console" element={<ChitConsole />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          </Routes>
        </Suspense>
      </Router>
    </DeploymentProvider>
  );
}

export default App
