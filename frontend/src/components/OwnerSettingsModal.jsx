import { useState, useEffect } from 'react';
import {
  X,
  Menu,
  User,
  Info,
  Shield,
  Phone,
  Mail,
  MapPin,
  Globe,
  Save,
  Upload,
  CheckCircle,
  AlertTriangle,
  Settings,
  Key,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useOwnerSettings } from '../hooks/useOwnerSettings.js';
import { useToast } from '../hooks/useToast.js';

function OwnerSettingsModal({ onClose }) {
  const { settings, updateSettings, updateContact } = useOwnerSettings();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('Profile');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [credentialTab, setCredentialTab] = useState('username');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMasterFallback, setShowMasterFallback] = useState(false);
  const [showFamilyCredentials, setShowFamilyCredentials] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showMasterFallbackPassword, setShowMasterFallbackPassword] = useState(false);
  const [showTempFamilyPassword, setShowTempFamilyPassword] = useState(false);
  const [credentialFields, setCredentialFields] = useState({
    currentUsername: '',
    newUsername: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    currentPin: '',
    newPin: '',
    confirmPin: '',
    masterFallbackUsername: '',
    masterFallbackPassword: '',
    tempFamilyUsername: '',
    tempFamilyPassword: ''
  });

  const [localSettings, setLocalSettings] = useState({
    brandName: settings.brandName,
    developerName: settings.developerName,
    systemVersion: settings.systemVersion,
    thermalPrinterStatus: settings.thermalPrinterStatus,
    storageStatus: settings.storageStatus,
    masterUsername: settings.masterUsername,
    masterPassword: '',
    securityPin: '',
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    masterEmail: settings.masterEmail,
    location: settings.location,
    portfolioUrl: settings.portfolioUrl
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleInputChange = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSettings({
      brandName: localSettings.brandName,
      developerName: localSettings.developerName,
      systemVersion: localSettings.systemVersion,
      thermalPrinterStatus: localSettings.thermalPrinterStatus,
      storageStatus: localSettings.storageStatus,
      masterUsername: localSettings.masterUsername,
      phone: localSettings.phone,
      whatsapp: localSettings.whatsapp,
      masterEmail: localSettings.masterEmail,
      location: localSettings.location,
      portfolioUrl: localSettings.portfolioUrl
    });

    updateContact({
      developerName: localSettings.developerName,
      phone: localSettings.phone,
      whatsapp: localSettings.whatsapp,
      masterEmail: localSettings.masterEmail,
      location: localSettings.location,
      portfolioUrl: localSettings.portfolioUrl
    });

    setSaveMessage('Settings saved successfully.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleMasterReset = () => {
    setShowResetConfirm(true);
    addToast('Are you sure you want to reset all system settings to defaults? Click the button below to confirm.', 'warning', 5000);
  };

  const confirmMasterReset = () => {
    updateSettings({
      brandName: 'SolaceHub Event Systems',
      developerName: 'Dennis Opoku Amponsah',
      systemVersion: 'SolaceHub v2.4-Stable',
      thermalPrinterStatus: 'Operational',
      storageStatus: 'Local Storage Active',
      masterUsername: 'Dennis_Opoku_Amponsah',
      phone: '+233 245660786',
      whatsapp: '+233 245660786',
      masterEmail: 'dennisopokuamponsah86@gmail.com',
      location: 'Kumasi, Ghana',
      portfolioUrl: 'https://neststack-tech.vercel.app/'
    });
    setLocalSettings({
      brandName: 'SolaceHub Event Systems',
      developerName: 'Dennis Opoku Amponsah',
      systemVersion: 'SolaceHub v2.4-Stable',
      thermalPrinterStatus: 'Operational',
      storageStatus: 'Local Storage Active',
      masterUsername: 'Dennis_Opoku_Amponsah',
      masterPassword: '',
      securityPin: '',
      phone: '+233 245660786',
      whatsapp: '+233 245660786',
      masterEmail: 'dennisopokuamponsah86@gmail.com',
      location: 'Kumasi, Ghana',
      portfolioUrl: 'https://neststack-tech.vercel.app/'
    });
    setShowResetConfirm(false);
    setSaveMessage('System reset to defaults.');
    addToast('System reset to defaults successfully.', 'success', 3000);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const cancelMasterReset = () => {
    setShowResetConfirm(false);
    addToast('Master reset cancelled.', 'info', 2000);
  };

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'About Application', icon: Info },
    { name: 'Security & Privacy', icon: Shield },
    { name: 'Public Contact', icon: Phone }
  ];

  const tabContent = {
    Profile: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Settings</h3>
          <p className="text-sm text-gray-500">Manage your service brand identity</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Brand Name</label>
            <input
              type="text"
              value={localSettings.brandName}
              onChange={(e) => handleInputChange('brandName', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
            <input
              type="text"
              value={localSettings.developerName}
              onChange={(e) => handleInputChange('developerName', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Logo / Profile Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-950 rounded-full flex items-center justify-center overflow-hidden">
                <img src={settings.avatar} alt="Brand" className="h-full w-full object-cover" />
              </div>
              <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Upload size={16} /> Upload Logo
              </button>
            </div>
          </div>
        </div>
      </div>
    ),

    'About Application': (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">About Application</h3>
          <p className="text-sm text-gray-500">System version and hardware diagnostics</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Version</label>
            <input
              type="text"
              value={localSettings.systemVersion}
              onChange={(e) => handleInputChange('systemVersion', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm font-medium text-gray-900">Thermal Printer</p>
              </div>
              <select
                value={localSettings.thermalPrinterStatus}
                onChange={(e) => handleInputChange('thermalPrinterStatus', e.target.value)}
                className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm bg-white"
              >
                <option>Operational</option>
                <option>Warning</option>
                <option>Offline</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-blue-600" />
                <p className="text-sm font-medium text-gray-900">Storage / Database</p>
              </div>
              <select
                value={localSettings.storageStatus}
                onChange={(e) => handleInputChange('storageStatus', e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
              >
                <option>Local Storage Active</option>
                <option>Cloud Sync Active</option>
                <option>Disconnected</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    ),

    'Security & Privacy': (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Security & Privacy</h3>
          <p className="text-sm text-gray-500">Master access credentials and reset controls</p>
        </div>

        {!showCredentialForm && !showMasterFallback && !showFamilyCredentials ? (
          <>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Master System Username</p>
                  <p className="text-sm font-semibold text-gray-900">{localSettings.masterUsername}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Three security buttons in same row */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCredentialForm(true)}
                className="flex-1 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shield size={14} /> Change Credentials
              </button>
              <button
                onClick={() => setShowMasterFallback(true)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key size={14} /> Master Fallback
              </button>
              <button
                onClick={() => setShowFamilyCredentials(true)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Users size={14} /> Family Credentials
              </button>
            </div>

            {!showResetConfirm ? (
            <button
              onClick={handleMasterReset}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-red-200 transition-colors"
            >
              <AlertTriangle size={18} /> Master Reset System
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={confirmMasterReset}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle size={18} /> Confirm Reset
              </button>
              <button
                onClick={cancelMasterReset}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          </>
        ) : showMasterFallback ? (
          <>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Key size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Master Fallback Key</h4>
                  <p className="text-xs text-gray-400">Owner Secret - Known only by System Owner</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Master Fallback Username</label>
                  <input
                    type="text"
                    value={credentialFields.masterFallbackUsername}
                    onChange={(e) => setCredentialFields({ ...credentialFields, masterFallbackUsername: e.target.value })}
                    placeholder="Enter master fallback username"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Master Fallback Password</label>
                  <div className="relative">
                    <input
                      type={showMasterFallbackPassword ? 'text' : 'password'}
                      value={credentialFields.masterFallbackPassword}
                      onChange={(e) => setCredentialFields({ ...credentialFields, masterFallbackPassword: e.target.value })}
                      placeholder="Enter master fallback password"
                      className="w-full px-3 py-2 pr-10 border border-slate-600 rounded-lg text-sm bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterFallbackPassword(!showMasterFallbackPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showMasterFallbackPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (credentialFields.masterFallbackUsername && credentialFields.masterFallbackPassword) {
                        updateSettings({
                          masterFallbackUsername: credentialFields.masterFallbackUsername,
                          masterFallbackPassword: credentialFields.masterFallbackPassword
                        });
                        setShowMasterFallback(false);
                        setSaveMessage('Master Fallback Key updated successfully.');
                        setTimeout(() => setSaveMessage(''), 3000);
                      }
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setShowMasterFallback(false)}
                    className="flex-1 py-2 border border-slate-600 rounded-lg text-xs font-medium text-gray-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : showFamilyCredentials ? (
          <>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Family Credentials</h4>
                  <p className="text-xs text-gray-500">Temporary Family Head Credentials</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Temp Family Username</label>
                  <input
                    type="text"
                    value={credentialFields.tempFamilyUsername}
                    onChange={(e) => setCredentialFields({ ...credentialFields, tempFamilyUsername: e.target.value })}
                    placeholder="Enter temporary family username"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Temp Family Password</label>
                  <div className="relative">
                    <input
                      type={showTempFamilyPassword ? 'text' : 'password'}
                      value={credentialFields.tempFamilyPassword}
                      onChange={(e) => setCredentialFields({ ...credentialFields, tempFamilyPassword: e.target.value })}
                      placeholder="Enter temporary family password"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-950"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTempFamilyPassword(!showTempFamilyPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showTempFamilyPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (credentialFields.tempFamilyUsername && credentialFields.tempFamilyPassword) {
                        updateSettings({
                          tempFamilyUsername: credentialFields.tempFamilyUsername,
                          tempFamilyPassword: credentialFields.tempFamilyPassword
                        });
                        setShowFamilyCredentials(false);
                        setSaveMessage('Family credentials provisioned successfully.');
                        setTimeout(() => setSaveMessage(''), 3000);
                      }
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setShowFamilyCredentials(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCredentialTab('username')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
                  credentialTab === 'username'
                    ? 'bg-indigo-950 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Username
              </button>
              <button
                onClick={() => setCredentialTab('password')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
                  credentialTab === 'password'
                    ? 'bg-indigo-950 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setCredentialTab('pin')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
                  credentialTab === 'pin'
                    ? 'bg-indigo-950 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                PIN
              </button>
            </div>

            {credentialTab === 'username' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={credentialFields.currentUsername}
                    onChange={(e) => setCredentialFields({ ...credentialFields, currentUsername: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={credentialFields.newUsername}
                    onChange={(e) => setCredentialFields({ ...credentialFields, newUsername: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (credentialFields.newUsername) {
                        handleInputChange('masterUsername', credentialFields.newUsername);
                        setShowCredentialForm(false);
                        setSaveMessage('Username updated successfully.');
                        setTimeout(() => setSaveMessage(''), 3000);
                      }
                    }}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setShowCredentialForm(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {credentialTab === 'password' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={credentialFields.currentPassword}
                      onChange={(e) => setCredentialFields({ ...credentialFields, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={credentialFields.newPassword}
                      onChange={(e) => setCredentialFields({ ...credentialFields, newPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={credentialFields.confirmPassword}
                      onChange={(e) => setCredentialFields({ ...credentialFields, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (credentialFields.newPassword && credentialFields.newPassword === credentialFields.confirmPassword) {
                        handleInputChange('masterPassword', credentialFields.newPassword);
                        setShowCredentialForm(false);
                        setSaveMessage('Password updated successfully.');
                        setTimeout(() => setSaveMessage(''), 3000);
                      }
                    }}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setShowCredentialForm(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {credentialTab === 'pin' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current PIN <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showCurrentPin ? 'text' : 'password'}
                      value={credentialFields.currentPin}
                      onChange={(e) => setCredentialFields({ ...credentialFields, currentPin: e.target.value })}
                      maxLength={6}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New PIN <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      value={credentialFields.newPin}
                      onChange={(e) => setCredentialFields({ ...credentialFields, newPin: e.target.value })}
                      maxLength={6}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm PIN <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      value={credentialFields.confirmPin}
                      onChange={(e) => setCredentialFields({ ...credentialFields, confirmPin: e.target.value })}
                      maxLength={6}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (credentialFields.newPin && credentialFields.newPin === credentialFields.confirmPin && credentialFields.newPin.length === 6) {
                        handleInputChange('securityPin', credentialFields.newPin);
                        setShowCredentialForm(false);
                        setSaveMessage('PIN updated successfully.');
                        setTimeout(() => setSaveMessage(''), 3000);
                      }
                    }}
                    className="flex-1 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setShowCredentialForm(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCredentialForm(false)}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Security Overview
            </button>
          </>
        )}
      </div>
    ),

    'Public Contact': (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Public Contact Settings</h3>
          <p className="text-sm text-gray-500">Feeds the landing page contact expansion card</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leader / Developer Name</label>
            <input
              type="text"
              value={localSettings.developerName}
              onChange={(e) => handleInputChange('developerName', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                value={localSettings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={14} /> WhatsApp Link
              </label>
              <input
                type="tel"
                value={localSettings.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail size={14} /> Support Email
            </label>
            <input
              type="email"
              value={localSettings.masterEmail}
              onChange={(e) => handleInputChange('masterEmail', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin size={14} /> Physical Location
            </label>
            <input
              type="text"
              value={localSettings.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Globe size={14} /> Developer Portfolio Website URL
            </label>
            <input
              type="url"
              value={localSettings.portfolioUrl}
              onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
            />
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto flex flex-col border border-gray-100">
        {/* Modal Header */}
        <div className="px-5 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center shadow">
              <Settings size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500">Owner preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`bg-gray-50 border-r border-gray-100 flex flex-col transition-all duration-300 ${
              sidebarExpanded ? 'w-56' : 'w-16'
            }`}
          >
            <div className="p-3 flex items-center justify-between">
              {sidebarExpanded && <span className="text-xs font-bold text-gray-900">Menu</span>}
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 ml-auto"
              >
                <Menu size={16} />
              </button>
            </div>
            <nav className="p-2 flex-1 overflow-y-auto space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-3 transition-colors ${
                    activeTab === tab.name
                      ? 'bg-white text-indigo-950 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  {sidebarExpanded && <span>{tab.name}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              {tabContent[activeTab]}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
              {saveMessage && (
                <span className="text-xs font-medium text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle size={12} /> {saveMessage}
                </span>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerSettingsModal;
