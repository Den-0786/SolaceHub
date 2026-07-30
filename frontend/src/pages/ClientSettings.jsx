import { useState, useEffect } from 'react';
import { X, User, Users, Shield, Save, Eye, EyeOff, Key, Receipt, Clock, MapPin, Calendar } from 'lucide-react';
import { useToast } from '../hooks/useToast.js';
import { useDeployment } from '../contexts/DeploymentContext';
import { useOwnerSettings } from '../hooks/useOwnerSettings.js';
import { API_CONFIG, fetchWithAuth } from '../config/api.js';
import logo from '/SolaceHubLogo.jpeg';

export default function ClientSettings({ onClose }) {
  const { addToast } = useToast();
  const { activeDeployment } = useDeployment();
  const { settings, updateSettings } = useOwnerSettings();
  const [activeTab, setActiveTab] = useState('Security');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showDeskPassword, setShowDeskPassword] = useState(false);
  const [showDeskConfirmPassword, setShowDeskConfirmPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const [credentialFields, setCredentialFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    deskOperatorUsername: '',
    deskOperatorPassword: '',
    deskOperatorConfirmPassword: ''
  });

  const [receiptSettings, setReceiptSettings] = useState({
    customFooterMessage: 'Thank you for your kind donation & support during this time of mourning.',
    showPhoneNumber: true
  });

  useEffect(() => {
    // Check if this is first login (using temporary credentials from context)
    setIsFirstLogin(settings.clientTempLogin);

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, settings.clientTempLogin]);

  const handlePasswordChange = () => {
    if (!isFirstLogin && credentialFields.currentPassword !== settings.clientPassword) {
      addToast('Current password is incorrect. Please try again.', 'error');
      return;
    }

    if (credentialFields.newPassword && credentialFields.newPassword === credentialFields.confirmPassword) {
      updateSettings({
        clientPassword: credentialFields.newPassword,
        clientTempLogin: false
      });
      setIsFirstLogin(false);
      setSaveMessage('Password changed successfully.');
      addToast('Password changed successfully. You can now access your dashboard.', 'success', 3000);
      setTimeout(() => setSaveMessage(''), 3000);
      setCredentialFields({
        ...credentialFields,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      addToast('Passwords do not match. Please try again.', 'error');
    }
  };

  const handleDeskOperatorSetup = () => {
    if (credentialFields.deskOperatorUsername &&
        credentialFields.deskOperatorPassword &&
        credentialFields.deskOperatorPassword === credentialFields.deskOperatorConfirmPassword) {
      updateSettings({
        deskOperatorUsername: credentialFields.deskOperatorUsername,
        deskOperatorPassword: credentialFields.deskOperatorPassword
      });
      setSaveMessage('Desk Operator credentials updated successfully.');
      addToast('Desk Operator credentials updated successfully.', 'success', 3000);
      setTimeout(() => setSaveMessage(''), 3000);
      setCredentialFields({
        ...credentialFields,
        deskOperatorUsername: '',
        deskOperatorPassword: '',
        deskOperatorConfirmPassword: ''
      });
    } else {
      addToast('Desk Operator passwords do not match. Please try again.', 'error');
    }
  };

  const handleReceiptSettingsSave = () => {
    localStorage.setItem('customFooterMessage', receiptSettings.customFooterMessage);
    localStorage.setItem('showPhoneNumber', receiptSettings.showPhoneNumber);
    setSaveMessage('Receipt settings updated successfully.');
    addToast('Receipt settings updated successfully.', 'success', 3000);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Client Settings</h2>
            <p className="text-xs text-gray-200">Manage security & receipts</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-200 hover:text-white hover:bg-gray-700 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-70px)]">
          {isFirstLogin && (
            <div className="bg-gradient-to-r from-accent-50 to-amber-50 border border-amber-200 rounded-2xl p-3 mb-5">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                  <Shield size={16} className="text-accent-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-accent-900">First-Time Login</p>
                  <p className="text-xs text-accent-700 mt-1">Set your new Client password to continue.</p>
                </div>
              </div>
            </div>
          )}

          {/* Event & Memorial Overview (Read-Only) */}
          {activeDeployment && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-gray-200 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar size={16} className="text-gray-900" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Event Overview</p>
                  <p className="text-xs text-gray-500">Read-only preview</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={logo} alt="Memorial" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{activeDeployment?.title || 'Deceased Name'}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {activeDeployment?.venue || 'Venue Location'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-full">
                        {activeDeployment?.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Clock size={16} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab('Security')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'Security'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('Receipts')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'Receipts'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Receipts
            </button>
          </div>

          {/* Security Tab */}
          {activeTab === 'Security' && (
            <div className="space-y-4">
              {/* Client Password */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-gray-900" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Client Password</p>
                    <p className="text-xs text-gray-500">Your private password</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {!isFirstLogin && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={credentialFields.currentPassword}
                          onChange={(e) => setCredentialFields({ ...credentialFields, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all"
                        />
                        <button
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={credentialFields.newPassword}
                        onChange={(e) => setCredentialFields({ ...credentialFields, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      value={credentialFields.confirmPassword}
                      onChange={(e) => setCredentialFields({ ...credentialFields, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Save size={16} /> Update Password
                  </button>
                </div>
              </div>

              {/* Desk Operator Credentials */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                    <Users size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Desk Operator</p>
                    <p className="text-xs text-gray-500">Station attendants</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={credentialFields.deskOperatorUsername}
                      onChange={(e) => setCredentialFields({ ...credentialFields, deskOperatorUsername: e.target.value })}
                      placeholder="Enter username"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showDeskPassword ? 'text' : 'password'}
                        value={credentialFields.deskOperatorPassword}
                        onChange={(e) => setCredentialFields({ ...credentialFields, deskOperatorPassword: e.target.value })}
                        placeholder="Enter password"
                        className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all"
                      />
                      <button
                        onClick={() => setShowDeskPassword(!showDeskPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showDeskPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showDeskConfirmPassword ? 'text' : 'password'}
                        value={credentialFields.deskOperatorConfirmPassword}
                        onChange={(e) => setCredentialFields({ ...credentialFields, deskOperatorConfirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all"
                      />
                      <button
                        onClick={() => setShowDeskConfirmPassword(!showDeskConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showDeskConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleDeskOperatorSetup}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Key size={16} /> Setup Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === 'Receipts' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                    <Receipt size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Receipt Customization</p>
                    <p className="text-xs text-gray-500">Customize thermal receipts</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Custom Footer Message</label>
                    <textarea
                      value={receiptSettings.customFooterMessage}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, customFooterMessage: e.target.value })}
                      placeholder="Enter thank-you message"
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Show Phone Numbers</p>
                      <p className="text-xs text-gray-500 mt-0.5">Include phone on receipts</p>
                    </div>
                    <button
                      onClick={() => setReceiptSettings({ ...receiptSettings, showPhoneNumber: !receiptSettings.showPhoneNumber })}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        receiptSettings.showPhoneNumber ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        receiptSettings.showPhoneNumber ? 'left-5' : 'left-0.5'
                      }`}></div>
                    </button>
                  </div>

                  <button
                    onClick={handleReceiptSettingsSave}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Save size={16} /> Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 font-medium">{saveMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
