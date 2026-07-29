import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '/SolaceHubLogo.jpeg';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Password reset for:', email);
    setIsSubmitted(true);
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">Forgot Password</h2>
            <p className="text-gray-500 text-xs">Enter your email to reset your password</p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">EMAIL</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-indigo-950 text-white py-3 rounded-full font-medium hover:bg-indigo-900 transition flex items-center justify-center gap-2 text-sm"
              >
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">Password reset link sent to your email!</p>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Try another email
              </button>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Back to Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs text-gray-400">Unauthorized access is strictly prohibited.</p>
          <p className="text-xs text-gray-400">Managed by SolaceHub Security Systems.</p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
