import { useEffect } from 'react';
import { Clock, Plus, Lock, RotateCcw, Download, Timer, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SessionTimerTab({
  eventName,
  setEventName,
  startTimestamp,
  setStartTimestamp,
  durationDays,
  setDurationDays,
  durationHours,
  setDurationHours,
  timeRemaining,
  setTimeRemaining,
  isLocked,
  setIsLocked
}) {

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startTimestamp).getTime();
      const durationMs = ((durationDays * 24) + durationHours) * 60 * 60 * 1000;
      const end = start + durationMs;
      const now = Date.now();
      const diff = end - now;

      if (isLocked || diff <= 0) {
        setTimeRemaining('00:00:00:00');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp, durationDays, durationHours, isLocked]);

  const handleExtend24Hours = () => {
    setDurationHours((prev) => prev + 24);
  };

  const handleLockSession = () => {
    setIsLocked(true);
  };

  const handleResetCredentials = () => {
    const now = new Date();
    setStartTimestamp(now.toISOString().slice(0, 16));
    setDurationDays(3);
    setDurationHours(0);
    setIsLocked(false);
  };

  const handleExportCSV = () => {
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
    link.setAttribute('download', 'solacehub_master_backup.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalDuration = (durationDays * 24) + durationHours;
  const start = new Date(startTimestamp).getTime();
  const durationMs = totalDuration * 60 * 60 * 1000;
  const end = start + durationMs;
  const now = Date.now();
  const diff = end - now;
  const elapsed = durationMs - diff;
  const progressPercentage = isLocked || diff <= 0 ? 100 : Math.max(0, (elapsed / durationMs) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Session Timer Control</h2>
        <p className="text-gray-500">Manage active time-bound rental periods and automated backups</p>
      </div>

      {/* Hero Active Timer Card */}
      <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-indigo-300" />
              <span className="text-indigo-300 text-sm font-medium uppercase tracking-wide">Active Session</span>
            </div>
            <h3 className="text-3xl font-bold">{eventName}</h3>
            <p className="text-indigo-200 text-sm mt-1">Live rental period in progress</p>
          </div>
          {isLocked ? (
            <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30">
              <Lock size={18} className="text-red-400" />
              <span className="text-red-300 font-medium text-sm">Session Locked</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-xl border border-green-500/30">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-green-300 font-medium text-sm">Session Active</span>
            </div>
          )}
        </div>

        {/* Countdown Clock */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
          <p className="text-indigo-200 text-sm mb-3 text-center">Time Remaining</p>
          <p className="text-5xl font-bold text-center tracking-wider font-mono">{timeRemaining}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-indigo-200 mb-2">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-400 to-indigo-300 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Time Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" />
            Time Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Timestamp</label>
              <input
                type="datetime-local"
                value={startTimestamp}
                onChange={(e) => setStartTimestamp(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration Presets</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setDurationDays(1); setDurationHours(0); }}
                  className={`flex-1 px-4 py-3 rounded-xl border font-medium transition-colors ${
                    durationDays === 1 && durationHours === 0
                      ? 'bg-indigo-950 text-white border-indigo-950'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  24 Hours
                </button>
                <button
                  onClick={() => { setDurationDays(2); setDurationHours(0); }}
                  className={`flex-1 px-4 py-3 rounded-xl border font-medium transition-colors ${
                    durationDays === 2 && durationHours === 0
                      ? 'bg-indigo-950 text-white border-indigo-950'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  48 Hours
                </button>
                <button
                  onClick={() => { setDurationDays(3); setDurationHours(0); }}
                  className={`flex-1 px-4 py-3 rounded-xl border font-medium transition-colors ${
                    durationDays === 3 && durationHours === 0
                      ? 'bg-indigo-950 text-white border-indigo-950'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  72 Hours
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Days</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Hours</label>
                <input
                  type="number"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                  min="0"
                  max="23"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Manual Override Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Timer size={20} className="text-indigo-600" />
            Manual Override Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleExtend24Hours}
              disabled={isLocked}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={20} /> Extend Session (+24 Hours)
            </button>
            <button
              onClick={handleLockSession}
              disabled={isLocked}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Lock size={20} /> Lock Session Immediately
            </button>
            <button
              onClick={handleResetCredentials}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={20} /> Reset Credentials to Default
            </button>
          </div>
        </div>
      </div>

      {/* Automated Expiration & CSV Backup Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download size={20} className="text-indigo-600" />
          Automated Expiration & CSV Backup
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <span className="font-medium text-gray-900">Auto-Lock Trigger</span>
            </div>
            <p className="text-sm text-gray-600">
              Session will automatically shut down at <strong>00:00:00</strong>. All active portals will be locked and users logged out.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle size={14} className="text-green-600" />
              Auto-lock status: <span className="font-medium text-gray-700">Enabled</span>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Download size={18} className="text-indigo-600" />
              <span className="font-medium text-gray-900">Master CSV Backup Log</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Export the full donation and chit transaction ledger even after credentials expire.
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full bg-indigo-950 hover:bg-indigo-900 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={18} /> Generate & Download Master CSV Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
