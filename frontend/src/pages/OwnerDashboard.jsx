/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Search,
  Bell,
  Download,
  Plus,
  Users,
  BarChart3,
  Timer,
  Circle
} from 'lucide-react';
import OwnerSettingsModal from '../components/OwnerSettingsModal.jsx';
import DeploymentTab from '../components/owner/DeploymentTab.jsx';
import SessionTimerTab from '../components/owner/SessionTimerTab.jsx';
import AnalyticsTab from '../components/owner/AnalyticsTab.jsx';
import CreateEventForm from '../components/owner/CreateEventForm.jsx';
import { useOwnerSettings } from '../hooks/useOwnerSettings.js';
import { useToast } from '../hooks/useToast.js';
import { useDeployment } from '../contexts/DeploymentContext.jsx';
import { useEvent } from '../contexts/EventContext.jsx';
import { API_CONFIG, getAuthHeaders, fetchWithAuth } from '../config/api.js';

function OwnerDashboard() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useOwnerSettings();
  const { addToast } = useToast();
  const { activeDeployment } = useDeployment();
  const { activeEventId, setActiveEventId, loadEvents, events: eventList } = useEvent();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Weekly');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [events, setEvents] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLabels, setAnalyticsLabels] = useState(null);

  // Load events for the owner and auto-select one if none active
  useEffect(() => {
    const initializeEvents = async () => {
      const loaded = await loadEvents();
      if (loaded.length > 0 && !activeEventId) {
        setActiveEventId(loaded[0].id);
      }
    };
    initializeEvents();
  }, []);

  // Fetch deployments from backend
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DEPLOYMENTS);
        if (response.ok) {
          const data = await response.json();
          setDeployments(data.results || data || []);
        }
      } catch (err) {
        console.error('Failed to fetch deployments:', err);
      }
    };
    fetchDeployments();
  }, []);

  // Deployment state shared with DeploymentTab
  const [deployments, setDeployments] = useState([]);

  // Session state
  const [eventName, setEventName] = useState('');
  const [startTimestamp, setStartTimestamp] = useState('');
  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const sidebarLinks = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Deployments', icon: Calendar },
    { name: 'Session Timer', icon: Clock },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Settings', icon: Settings }
  ];

  const bottomLinks = [
    { name: 'Sign Out', icon: LogOut }
  ];

  const handleLogout = async () => {
    try {
      await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('clientPassword');
      localStorage.removeItem('deskOperatorPassword');
      localStorage.removeItem('isTempLogin');
      addToast('Signed out successfully.', 'info', 2000);
      navigate('/login');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        addToast('Password changed successfully', 'success');
        setShowPasswordChange(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        addToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      addToast('Connection error', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const maxValue = useMemo(() => {
    if (!analyticsData || !analyticsData[analyticsPeriod]) return 0;
    return Math.max(...analyticsData[analyticsPeriod], 0);
  }, [analyticsPeriod, analyticsData]);

  const handleExtend24Hours = () => {
    setDurationHours((prev) => prev + 24);
  };

  const handleResetCredentials = () => {
    const now = new Date();
    setStartTimestamp(now.toISOString().slice(0, 16));
    setDurationDays(3);
    setDurationHours(0);
    setIsLocked(false);
    updateSettings({ sessionExpired: false });
  };

  const handleReset = () => {
    updateSettings({ sessionExpired: false });
  };

  const handleExpirationLock = () => {
    setIsLocked(true);
    updateSettings({ sessionExpired: true });

    // 1. Invalidate all active user sessions and tokens
    // TODO: Replace localStorage with secure backend authentication when ready
    localStorage.removeItem('clientPassword');
    localStorage.removeItem('deskOperatorPassword');
    localStorage.removeItem('isTempLogin');

    // 2. Overwrite both client_password and desk_operator_password with Master Fallback Password
    const masterFallbackPassword = settings.masterFallbackPassword || 'default-master-fallback';
    localStorage.setItem('clientPassword', masterFallbackPassword);
    localStorage.setItem('deskOperatorPassword', masterFallbackPassword);

    // 3. Lock all live portals and compile final Master CSV Archive
    addToast('Event session expired. All user sessions invalidated, passwords reset to Master Fallback Key.', 'warning', 5000);
    addToast('Live portals locked. Master CSV Archive compilation initiated.', 'info', 5000);

    // Trigger CSV export
    handleExportCSV();
  };

  const handleEventCreated = (newEvent) => {
    loadEvents().then(() => {
      if (newEvent?.id) {
        setActiveEventId(newEvent.id);
        addToast(`Switched to event: ${newEvent.title || newEvent.family_name}`, 'success');
      }
    });
  };

  const handleExportCSV = async () => {
    if (!activeDeployment?.id) {
      addToast('No active event selected', 'error');
      return;
    }

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.DEPLOYMENTS + `${activeDeployment.id}/backups/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        addToast(`Backup created. ${data.record_count ?? 0} records archived.`, 'success');
        if (data.warning) {
          addToast(data.warning, 'warning', 6000);
        }
        if (data.csv_data) {
          const blob = new Blob([data.csv_data], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `solacehub_backup_${activeDeployment.id}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (data.csv_file) {
          const link = document.createElement('a');
          link.href = data.csv_file;
          link.setAttribute('download', `solacehub_backup_${activeDeployment.id}.csv`);
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
    }
  };

  const metrics = useMemo(() => {
    const pendingCount = deployments.filter(d => d.status === 'pending' || d.status === 'Pending').length;
    const activeCount = deployments.filter(d => d.status === 'attended' || d.status === 'Attended').length;
    const hiredCount = pendingCount + activeCount;

    // Use event list for total events count
    const totalEvents = eventList.length;

    return [
      { label: 'Total Events', value: totalEvents.toString(), subtext: 'All registered events' },
      { label: 'Hired Events', value: hiredCount.toString(), subtext: 'Active live deployments' },
      { label: 'Pending Events', value: pendingCount.toString(), subtext: 'Upcoming hardware bookings' },
      { label: 'Completed Events', value: activeCount.toString(), subtext: 'Wrapped funeral sessions' }
    ];
  }, [deployments, eventList]);

  const renderMainContent = () => {
    if (activeLink === 'Settings') {
      setShowSettings(true);
      setActiveLink('Dashboard');
      return null;
    }

    if (activeLink === 'Deployments') {
      return (
        <DeploymentTab
          deployments={deployments}
          setDeployments={setDeployments}
        />
      );
    }

    if (activeLink === 'Session Timer') {
      return (
        <SessionTimerTab
          eventName={eventName}
          setEventName={setEventName}
          startTimestamp={startTimestamp}
          setStartTimestamp={setStartTimestamp}
          durationDays={durationDays}
          setDurationDays={setDurationDays}
          durationHours={durationHours}
          setDurationHours={setDurationHours}
          timeRemaining={timeRemaining}
          setTimeRemaining={setTimeRemaining}
          isLocked={isLocked}
          setIsLocked={setIsLocked}
          onExpire={handleExpirationLock}
          onReset={handleReset}
          onExportCSV={handleExportCSV}
        />
      );
    }

    if (activeLink === 'Analytics') {
      return <AnalyticsTab />;
    }

    return (
      <>
        <CreateEventForm onCreated={handleEventCreated} />

        {/* Hero Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">{metric.label}</p>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs text-gray-400 mt-2">{metric.subtext}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Rental Session Controller */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg">
                <Timer size={16} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Active Deployment</h2>
                <p className="text-xs sm:text-sm text-gray-500">Live rental session controller</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-indigo-600 font-medium mb-1">Event Name</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{eventName}</p>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mb-1">Duration</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{durationDays} days {durationHours} hours</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-blue-600 font-medium mb-1">Start Day & Time</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{new Date(startTimestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div className="bg-gradient-to-r from-accent-50 to-white border border-amber-200 rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-accent-700 font-medium mb-1">End Day & Time</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900">{new Date(new Date(startTimestamp).getTime() + ((durationDays * 24 + durationHours) * 60 * 60 * 1000)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="bg-indigo-900 rounded-2xl p-6 mb-6 text-center">
              <p className="text-xs text-indigo-200 uppercase tracking-wide mb-2">Time Remaining</p>
              <p className="text-3xl font-mono font-bold text-white">{timeRemaining}</p>
            </div>
          </div>

          {/* Master Event Archive */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Master Event Archive</h2>
                <p className="text-sm text-gray-500">Expired deployments and transaction history</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-sm font-medium flex items-center justify-center sm:justify-start gap-2"
              >
                <Download size={16} /> Export Master CSV Backup
              </button>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Event Title</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-indigo-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{event.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{event.date}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{event.transactions}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600">
                          <Circle size={6} className="text-indigo-400 fill-indigo-400" />
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-indigo-900 border-b border-gray-200 z-30 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-indigo-800 rounded-lg"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 sm:w-8 h-6 sm:h-8 bg-indigo-800 rounded-full flex items-center justify-center">
            <img src={settings.avatar} alt="SolaceHub" className="h-4 sm:h-6 w-4 sm:w-6 rounded-full object-cover" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white">SolaceHub</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-white hover:bg-indigo-800 rounded-lg relative">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-indigo-900 text-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
          sidebarExpanded ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarExpanded && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-800 rounded-full flex items-center justify-center">
                <img src={settings.avatar} alt="SolaceHub" className="h-7 w-7 rounded-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">SolaceHub</p>
                <p className="text-xs text-indigo-200">Owner</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 hover:bg-indigo-800 rounded-lg text-white hidden lg:block"
            >
              {sidebarExpanded ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-indigo-800 rounded-lg text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  if (link.name === 'Settings') {
                    setShowSettings(true);
                  } else {
                    setActiveLink(link.name);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                  activeLink === link.name && link.name !== 'Settings'
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800'
                }`}
              >
                <link.icon size={20} />
                {sidebarExpanded && <span>{link.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-gray-200">
          <nav className="space-y-1">
            {bottomLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  if (link.name === 'Sign Out') {
                    handleLogout();
                  }
                }}
                className="w-full text-left px-3 py-3 rounded-xl text-sm font-medium flex items-center gap-3 text-indigo-200 hover:bg-indigo-800 transition-colors"
              >
                <link.icon size={20} />
                {sidebarExpanded && <span>{link.name}</span>}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'} ml-0 pt-16 lg:pt-0 overflow-x-hidden`}>
        <main className="p-4 sm:p-6">
          {renderMainContent()}
        </main>
      </div>

      {showSettings && <OwnerSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default OwnerDashboard;
