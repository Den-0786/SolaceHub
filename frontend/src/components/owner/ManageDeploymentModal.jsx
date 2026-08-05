import { useState, useEffect } from 'react';
import { X, Printer, Tablet, CheckCircle, AlertCircle, Wifi, Battery, RefreshCw, Copy, Lock, Clock, Plus, MapPin, User, Settings, Download, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast.js';
import { API_CONFIG, fetchWithAuth, getAuthHeaders } from '../../config/api.js';

export default function ManageDeploymentModal({ deployment, onClose, onUpdateStatus, hardwareInventory, updateHardwareStatus, onEdit, onDelete }) {
  const { addToast } = useToast();
  const [status, setStatus] = useState(
    deployment?.status ? deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1) : 'Pending'
  );
  const [showCredentials, setShowCredentials] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('--');
  const [sessionProgress, setSessionProgress] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(deployment?.session_timer || null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [clientCredential, setClientCredential] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [donationCount, setDonationCount] = useState(0);
  const [chitCount, setChitCount] = useState(0);

  // Hardware selection state
  const deploymentHardware = deployment?.hardware || [];
  const [selectedTablets, setSelectedTablets] = useState(deploymentHardware.filter(h => h.startsWith('TAB')));
  const [selectedDonationPrinter, setSelectedDonationPrinter] = useState(
    deploymentHardware.find(h => h.startsWith('PRN') && !h.includes('B')) || ''
  );
  const [selectedChitPrinter, setSelectedChitPrinter] = useState(
    deploymentHardware.find(h => h.includes('B')) || ''
  );

  // Real-time countdown based on the live session timer record
  useEffect(() => {
    if (!sessionTimer) return undefined;
    const tick = () => {
      const start = new Date(sessionTimer.start_timestamp).getTime();
      if (isNaN(start)) return;
      const durationMs = ((sessionTimer.duration_days * 24) + (sessionTimer.duration_hours || 0)) * 60 * 60 * 1000;
      const diff = (start + durationMs) - Date.now();
      if (!sessionTimer.is_active || diff <= 0) {
        setTimeRemaining('00:00:00:00');
        setSessionProgress(100);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(
        `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
      const total = durationMs || 1;
      setSessionProgress(Math.min(100, Math.max(0, ((durationMs - diff) / total) * 100)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionTimer]);

  // Load real data: client credential, donor/chit counts, and the session timer
  useEffect(() => {
    if (!deployment) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const credResponse = await fetchWithAuth(API_CONFIG.ENDPOINTS.CREDENTIALS);
        if (!cancelled && credResponse.ok) {
          const data = await credResponse.json();
          const list = data.results || data || [];
          setClientCredential(list.find((c) => c.credential_type === 'client') || null);
        }
      } catch (err) {
        console.error('Failed to fetch credentials:', err);
      }

      try {
        const [donorsRes, chitsRes] = await Promise.all([
          fetchWithAuth(API_CONFIG.ENDPOINTS.DONORS),
          fetchWithAuth(API_CONFIG.ENDPOINTS.CHITS),
        ]);
        if (!cancelled) {
          if (donorsRes.ok) {
            const d = await donorsRes.json();
            setDonationCount((d.results || d || []).length);
          }
          if (chitsRes.ok) {
            const c = await chitsRes.json();
            setChitCount((c.results || c || []).length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }

      try {
        const sessionRes = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.DEPLOYMENTS}${deployment.id}/session-timer/`);
        if (!cancelled && sessionRes.ok) {
          setSessionTimer(await sessionRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch session timer:', err);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [deployment?.id]);

  if (!deployment) {
    return null;
  }

  const generatePassword = (length = 8) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (onUpdateStatus) {
      onUpdateStatus(deployment.id, newStatus);
    }
  };

  const handleKeepPending = () => {
    handleStatusChange('Pending');
  };

  const handleMarkCompleted = () => {
    handleStatusChange('Attended');
  };

  const handleRejectEvent = () => {
    handleStatusChange('Rejected');
  };

  const handleTestPrint = () => {
    console.log('Sending test receipt print to', deployment.hardware);
  };

  const handleSwapHardware = () => {
    console.log('Opening hardware swap dialog for', deployment.hardware);
  };

  const handleHardwareUpdate = () => {
    const selectedHardware = [
      ...selectedTablets,
      selectedDonationPrinter,
      selectedChitPrinter
    ].filter(h => h);

    // Release old hardware
    (deployment.hardware || []).forEach(hardwareId => {
      if (!selectedHardware.includes(hardwareId)) {
        updateHardwareStatus(hardwareId, 'Available', null);
      }
    });

    // Assign new hardware
    selectedHardware.forEach(hardwareId => {
      if (!(deployment.hardware || []).includes(hardwareId)) {
        updateHardwareStatus(hardwareId, 'In Use', deployment.id);
      }
    });

    // Update deployment with new hardware
    if (onUpdateStatus) {
      onUpdateStatus(deployment.id, status, selectedHardware);
    }
  };

  const handleExtend24Hours = async () => {
    if (!sessionTimer) {
      addToast('No session timer found. Configure the session first.', 'error');
      return;
    }
    setSessionBusy(true);
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.DEPLOYMENTS}${deployment.id}/session-timer/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_days: sessionTimer.duration_days,
          duration_hours: (sessionTimer.duration_hours || 0) + 24,
          is_active: true,
        }),
      });
      if (response.ok) {
        setSessionTimer(await response.json());
        addToast('Session extended by 24 hours', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        addToast('Failed to extend session: ' + (errorData.detail || errorData.error || JSON.stringify(errorData)), 'error', 6000);
      }
    } catch (err) {
      console.error('Failed to extend session:', err);
      addToast('Failed to extend session', 'error');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleLockSession = async () => {
    if (!window.confirm('Locking this session will archive all donation & chit records, expire the client credentials, and lock all portals. Continue?')) {
      return;
    }
    setSessionBusy(true);
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.DEPLOYMENTS}${deployment.id}/backups/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        if (sessionTimer) setSessionTimer({ ...sessionTimer, is_active: false });
        addToast(`Session locked. ${data.record_count ?? 0} records archived.`, 'success');
        if (data.warning) addToast(data.warning, 'warning', 6000);
      } else {
        addToast(data.error || `Failed to lock session (${response.status})`, 'error');
      }
    } catch (err) {
      console.error('Failed to lock session:', err);
      addToast('Failed to lock session', 'error');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleRegenerateCredentials = async () => {
    const newUsername = `temp_family_${deployment.id}`;
    const newPassword = generatePassword(8);
    setSessionBusy(true);
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.CREDENTIALS_UPDATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_type: 'client',
          username: newUsername,
          password: newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setClientCredential(data);
        setGeneratedPassword(newPassword);
        setShowCredentials(true);
        addToast('Client credentials generated successfully', 'success');
      } else {
        addToast(data.error || 'Failed to generate credentials', 'error', 6000);
      }
    } catch (err) {
      console.error('Failed to generate credentials:', err);
      addToast('Failed to generate credentials', 'error');
    } finally {
      setSessionBusy(false);
    }
  };

  const handleCopyCredentials = () => {
    const username = clientCredential?.username || 'Not set';
    const password = generatedPassword || 'set by client (not recoverable)';
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`).then(() => {
      addToast('Credentials copied to clipboard', 'success');
    }).catch(() => {
      addToast('Failed to copy credentials', 'error');
    });
  };

  const handleDownloadCSV = async () => {
    setSessionBusy(true);
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.DEPLOYMENTS}${deployment.id}/backups/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        addToast(`Backup created. ${data.record_count ?? 0} records archived.`, 'success');
        if (data.warning) addToast(data.warning, 'warning', 6000);
        if (data.csv_data) {
          const blob = new Blob([data.csv_data], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `solacehub_backup_${deployment.id}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (data.csv_file) {
          const link = document.createElement('a');
          link.href = data.csv_file;
          link.setAttribute('download', `solacehub_backup_${deployment.id}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        addToast(data.error || data.message || `Failed to create backup (${response.status})`, 'error');
      }
    } catch (err) {
      console.error('Backup export error:', err);
      addToast('Backup export failed', 'error');
    } finally {
      setSessionBusy(false);
    }
  };

  const assignedHardware = (deployment.hardware || []).map(hwId => {
    if (!hardwareInventory) {
      console.log('hardwareInventory is undefined in ManageDeploymentModal');
      return { id: hwId, name: 'Unknown Device', type: 'unknown', status: 'Unknown', battery: null, ip: 'N/A' };
    }
    const hw = hardwareInventory.find(h => h.id === hwId);
    return hw || { id: hwId, name: 'Unknown Device', type: 'unknown', status: 'Unknown', battery: null, ip: 'N/A' };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 p-4 sm:p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{deployment?.title || 'Unknown Event'}</h2>
              <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-2">
                <MapPin size={12} /> {deployment?.venue || 'Unknown Venue'} • <User size={12} /> {deployment?.client || 'Unknown Client'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Event ID: #{deployment?.id}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Status Badge at Top */}
          <div className="mt-3 sm:mt-4">
            <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
              status === 'Pending' ? 'bg-yellow-400 text-yellow-900' : 
              status === 'Attended' ? 'bg-green-400 text-green-900' : 
              'bg-red-400 text-red-900'
            }`}>
              {status === 'Pending' && <Clock size={14} />}
              {status === 'Attended' && <CheckCircle size={14} />}
              {status === 'Rejected' && <AlertCircle size={14} />}
              {status}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Event Details */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-100">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <User size={16} className="text-indigo-600" />
              Event Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Client Name</p>
                <p className="text-sm font-medium text-gray-900">{deployment?.client || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                <p className="text-sm font-medium text-gray-900">{deployment?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Venue Location</p>
                <p className="text-sm font-medium text-gray-900">{deployment?.venue || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Event Dates</p>
                <p className="text-sm font-medium text-gray-900">{deployment?.dates || 'TBD'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Role Mapping</p>
                <p className="text-sm font-medium text-gray-900">{deployment?.roleMapping || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Lifecycle Decision Controls - Same Row */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={18} className="text-indigo-600" />
              Lifecycle Decision Controls
            </h3>
            <style>
              {`@media (min-width: 640px) {
                .lifecycle-buttons-scroll {
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                }
              }
              @media (max-width: 639px) {
                .lifecycle-buttons-scroll {
                  overflow-x: auto !important;
                  -webkit-overflow-scrolling: touch !important;
                  max-width: 100vw !important;
                  width: 100% !important;
                  margin-left: -16px !important;
                  margin-right: -16px !important;
                  padding-left: 16px !important;
                  padding-right: 16px !important;
                }
              }`}
            </style>
            <div className="lifecycle-buttons-scroll" style={{ width: '100%', overflowX: 'auto' }}>
              <div className="flex gap-3" style={{ display: 'inline-flex', minWidth: '100%' }}>
                <button
                  onClick={handleKeepPending}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-yellow-200 rounded-xl text-sm font-semibold text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300 transition-all shadow-sm"
                >
                  <Clock size={16} /> Keep Pending
                </button>
                <button
                  onClick={handleMarkCompleted}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-green-200 rounded-xl text-sm font-semibold text-green-700 hover:bg-green-50 hover:border-green-300 transition-all shadow-sm"
                >
                  <CheckCircle size={16} /> Mark as Completed
                </button>
                <button
                  onClick={handleRejectEvent}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-200 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                >
                  <AlertCircle size={16} /> Reject / Cancel Event
                </button>
              </div>
            </div>
          </div>

          {/* Live Session Timer Controls with Progress Bar */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-amber-600" />
                Session Control
              </h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
                  sessionTimer?.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {sessionTimer?.is_active ? <CheckCircle size={12} /> : <Lock size={12} />}
                  {sessionTimer?.is_active ? 'Active' : 'Locked / Inactive'}
                </span>
                <div className="text-sm font-bold text-amber-700 bg-white px-3 py-1 rounded-full shadow-sm">{timeRemaining}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Session Progress</span>
                <span>{sessionProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sessionProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExtend24Hours}
                disabled={sessionBusy || !sessionTimer}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                {sessionBusy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Extend +24 Hours
              </button>
              <button
                onClick={handleLockSession}
                disabled={sessionBusy}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
              >
                {sessionBusy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Lock Session Now
              </button>
            </div>
          </div>

          {/* Temporary Credentials Card with Masked Password */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-indigo-600" />
                Client Onboarding Credentials
              </h3>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {showCredentials ? 'Hide' : 'Show'}
              </button>
            </div>

            {showCredentials ? (
              <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temporary Family Head Username</label>
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {clientCredential?.username || 'Not set — generate below'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temporary Family Head Password</label>
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono tracking-wider">
                    {generatedPassword || '••••••••••••••••'}
                  </p>
                  {!generatedPassword && (
                    <p className="text-xs text-gray-400 mt-1">
                      Passwords are stored hashed and cannot be recovered. Use Generate to issue a new one.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleRegenerateCredentials}
                    disabled={sessionBusy}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    {sessionBusy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Generate Credentials
                  </button>
                  <button
                    onClick={handleCopyCredentials}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Copy size={14} /> Copy WhatsApp Login Info
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 bg-white rounded-xl p-4 text-center">••••••••••••••••</p>
            )}
          </div>

          {/* Hardware Diagnostic Controls */}
          {hardwareInventory && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Wifi size={18} className="text-indigo-600" />
                  Hardware Diagnostics
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleTestPrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Printer size={14} /> Test Print
                  </button>
                  <button
                    onClick={handleSwapHardware}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw size={14} /> Swap Equipment
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {assignedHardware.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                        {item.type === 'Tablet' ? <Tablet size={20} className="text-indigo-600" /> : <Printer size={20} className="text-indigo-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Wifi size={12} /> {item.ip}
                          {item.battery !== null && (
                            <>
                              <span>•</span>
                              <Battery size={12} /> {item.battery}%
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                      item.status === 'Available' ? 'bg-green-100 text-green-700' : 
                      item.status === 'In Use' ? 'bg-amber-100 text-amber-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status === 'Available' && <CheckCircle size={14} />}
                      {item.status === 'In Use' && <AlertCircle size={14} />}
                      {item.status !== 'Available' && item.status !== 'In Use' && <AlertCircle size={14} />}
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Master Archive & Data Export */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-emerald-600" />
                Master Archive & Data Export
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-emerald-600">{donationCount}</p>
                <p className="text-xs text-gray-600">Donation Count</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-teal-600">{chitCount}</p>
                <p className="text-xs text-gray-600">Chit Count</p>
              </div>
            </div>

            <button
              onClick={handleDownloadCSV}
              disabled={sessionBusy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm disabled:opacity-50"
            >
              {sessionBusy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download Master CSV Archive
            </button>
          </div>

          {/* Edit & Delete Actions */}
          {(onEdit || onDelete) && (
            <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-100 pt-4">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Settings size={16} /> Edit Deployment Details
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-sm"
                >
                  <AlertCircle size={16} /> Delete Deployment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
