import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, KeyRound, LogIn, Eye, EyeOff, X } from 'lucide-react';
import logo from '/SolaceHubLogo.jpeg';
import { useToast } from '../hooks/useToast.js';
import { API_CONFIG } from '../config/api.js';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [modalAccessCode, setModalAccessCode] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e, forcedAccessCode) => {
    if (e && e.preventDefault) e.preventDefault();
    const accessCodeToUse = (forcedAccessCode !== undefined ? forcedAccessCode : accessCode).trim();

    if (!username.trim() || !password) {
      addToast('Please enter your username and password', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          ...(accessCodeToUse && { access_code: accessCodeToUse }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.event_id) {
          localStorage.setItem('activeEventId', data.event_id);
        } else {
          localStorage.removeItem('activeEventId');
        }

        const routeMap = {
          'owner': '/owner-dashboard',
          'admin': '/admin-dashboard',
          'client': '/admin-dashboard',
          'desk_operator': '/chit-console',
        };

        const route = routeMap[data.user.role] || '/';
        const displayName = data.user.display_name || data.user.username;
        addToast(`Welcome back, ${data.user.role} (${displayName})`, 'success', 2500);
        setTimeout(() => {
          window.location.href = route;
        }, 800);
        setLoading(false);
        return;
      }

      if (data.error === 'Session expired') {
        addToast('Session expired. Contact the system administrator.', 'error', 5000);
      } else if (data.error === 'Multiple events matched') {
        addToast(data.message || 'This username exists for more than one event. Enter the access code.', 'error', 5000);
      } else if (data.error === 'Session still active' || data.error === 'Access code required') {
        addToast(data.message || data.error, 'error', 5000);
      } else {
        addToast(data.error || 'Invalid username or password.', 'error');
      }
    } catch (err) {
      console.error('Backend login error:', err);
      addToast('Login failed. Please try again.', 'error');
    }

    setLoading(false);
  };

  const handleAccessCodeLogin = async () => {
    if (!modalAccessCode.trim()) {
      addToast('Please enter the event access code', 'error');
      return;
    }
    setShowAccessCodeModal(false);
    setModalAccessCode('');
    await handleSubmit(null, modalAccessCode);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full p-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="SolaceHub" className="h-8 w-8 rounded-full" />
              <span className="text-lg font-bold text-gray-900">SolaceHub</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Access System</h2>
            <p className="text-gray-500 text-xs">Please sign in to the registry desk</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">USERNAME</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="registry_admin"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">PASSWORD</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3 h-3 text-indigo-950 border-gray-300 rounded focus:ring-indigo-950"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-gray-600">
                  Remember this station
                </label>
              </div>
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600">Forgot?</Link>
            </div>

            {/* Use Access Code (opens modal) */}
            <button
              type="button"
              onClick={() => {
                setModalAccessCode('');
                setShowAccessCodeModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-indigo-950 hover:text-indigo-700 transition-colors py-1"
            >
              <KeyRound size={14} /> OR USE ACCESS CODE
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-950 text-white py-3 rounded-full font-medium hover:bg-indigo-900 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'} <LogIn size={16} />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to Homepage</Link>
        </div>
      </div>

      {/* Access Code Modal */}
      {showAccessCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAccessCodeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-600" /> Use Access Code
              </h3>
              <button
                onClick={() => setShowAccessCodeModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Enter the event access code. Your username and password are still required and will be used to sign in.
            </p>
            <input
              type="text"
              value={modalAccessCode}
              onChange={(e) => setModalAccessCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAccessCodeLogin();
                }
              }}
              placeholder="e.g. ADUANA39923"
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950 focus:border-transparent text-sm"
            />
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowAccessCodeModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccessCodeLogin}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-950 text-white hover:bg-indigo-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'} {!loading && <LogIn size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
