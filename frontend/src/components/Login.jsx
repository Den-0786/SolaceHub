import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import logo from '/SolaceHubLogo.jpeg';
import { useToast } from '../hooks/useToast.js';
import { API_CONFIG, getAuthHeaders } from '../config/api.js';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        const routeMap = {
          'owner': '/owner-dashboard',
          'admin': '/admin-dashboard',
          'family_head': '/admin-dashboard',
          'desk_operator': '/chit-console',
        };
        
        const route = routeMap[data.user.role] || '/';
        addToast(`Welcome back, ${data.user.role} (${username})`, 'success', 2500);
        setTimeout(() => {
          window.location.href = route;
        }, 800);
      } else if (response.status === 403 && data.fallback !== undefined) {
        // Handle subscription expiration
        setError(data.message || 'Subscription expired');
        addToast(data.message || 'Subscription expired. Please contact system administration.', 'error', 5000);
      } else {
        setError(data.error || 'Invalid username or password.');
        addToast(data.error || 'Invalid username or password.', 'error');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      addToast('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
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

            {error && (
              <p className="text-xs text-red-600 text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

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
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs text-gray-400">Unauthorized access is strictly prohibited.</p>
          <p className="text-xs text-gray-400">Managed by SolaceHub Security Systems.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="text-xs text-gray-500 hover:text-gray-700">Support</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-700">Privacy</a>
          </div>
          <div className="mt-3">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to Homepage</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
