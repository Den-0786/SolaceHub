import { useState } from 'react';
import { X, Printer, Tablet, CheckCircle, AlertCircle, Wifi, Battery, RefreshCw, Copy, Lock, Clock, Plus, MapPin, User, Settings, Download } from 'lucide-react';

export default function ManageDeploymentModal({ deployment, onClose, onUpdateStatus, hardwareInventory, updateHardwareStatus }) {
  if (!deployment) {
    return null;
  }
  
  const [status, setStatus] = useState(deployment.status || 'Pending');
  const [showCredentials, setShowCredentials] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('1d 12h 45m 30s');
  const [sessionProgress, setSessionProgress] = useState(65); // Progress percentage
  const [transactionStats, setTransactionStats] = useState({
    donationCount: 124,
    chitCount: 89
  });
  
  // Hardware selection state
  const [selectedTablets, setSelectedTablets] = useState(deployment.hardware ? deployment.hardware.filter(h => h.startsWith('TAB')) : []);
  const [selectedDonationPrinter, setSelectedDonationPrinter] = useState(
    deployment.hardware ? deployment.hardware.find(h => h.startsWith('PRN') && !h.includes('B')) || '' : ''
  );
  const [selectedChitPrinter, setSelectedChitPrinter] = useState(
    deployment.hardware ? deployment.hardware.find(h => h.includes('B')) || '' : ''
  );

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (onUpdateStatus) {
      onUpdateStatus(deployment.id, newStatus);
    }
  };

  const handleKeepPending = () => {
    setStatus('Pending');
    if (onUpdateStatus) {
      onUpdateStatus(deployment.id, 'Pending');
    }
  };

  const handleMarkCompleted = () => {
    setStatus('Attended');
    if (onUpdateStatus) {
      onUpdateStatus(deployment.id, 'Attended');
    }
    // Trigger master CSV backup logic would go here
    console.log('Event marked as completed, triggering master CSV backup...');
  };

  const handleRejectEvent = () => {
    setStatus('Rejected');
    if (onUpdateStatus) {
      onUpdateStatus(deployment.id, 'Rejected');
    }
    // Hardware release is handled in the parent component
    console.log('Event rejected, hardware released...');
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

  const handleRegenerateCredentials = () => {
    console.log('Regenerating temp credentials for deployment', deployment.id);
  };

  const handleCopyCredentials = () => {
    const credentials = `Username: temp_family_${deployment.id}\nPassword: temp_pass_${deployment.id}`;
    navigator.clipboard.writeText(credentials);
    alert('Credentials copied to clipboard!');
  };

  const handleExtend24Hours = () => {
    console.log('Extending session by 24 hours for deployment', deployment.id);
  };

  const handleLockSession = () => {
    console.log('Locking session for deployment', deployment.id);
  };

  const handleDownloadCSV = () => {
    const rows = [
      ['Receipt No.', 'Donor Name', 'Amount (GHC)', 'Time', 'Logged By'],
      ['#RC-8821', 'Daniel Boateng', '2500.00', '14:22 PM', 'Kwame Akoto'],
      ['#RC-8820', 'Ama Serwaa', '1200.00', '14:15 PM', 'Sister Abena'],
      ['#CH-1024', 'Elder Owusu', 'VIP Package', '14:18 PM', 'Kwame Akoto']
    ];
    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `solacehub_master_backup_${deployment.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <div className="text-sm font-bold text-amber-700 bg-white px-3 py-1 rounded-full shadow-sm">{timeRemaining}</div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Session Progress</span>
                <span>{sessionProgress}%</span>
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
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
              >
                <Plus size={16} /> Extend +24 Hours
              </button>
              <button
                onClick={handleLockSession}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all shadow-sm"
              >
                <Lock size={16} /> Lock Session Now
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
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">temp_family_{deployment.id}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temporary Family Head Password</label>
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono tracking-wider">••••••••••••••••••••••••••••••••</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleRegenerateCredentials}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    <RefreshCw size={14} /> Regenerate Credentials
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
              <p className="text-sm text-gray-600 bg-white rounded-xl p-4 text-center">••••••••••••••••••••••••••••••••</p>
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
                <p className="text-2xl font-bold text-emerald-600">{transactionStats.donationCount}</p>
                <p className="text-xs text-gray-600">Donation Count</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-teal-600">{transactionStats.chitCount}</p>
                <p className="text-xs text-gray-600">Chit Count</p>
              </div>
            </div>

            <button
              onClick={handleDownloadCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm"
            >
              <Download size={16} /> Download Master CSV Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
