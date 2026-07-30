import { useState, useEffect } from 'react';
import { Search, Bell, HelpCircle, User, LayoutDashboard, ClipboardList, Ticket, BarChart, Settings, LogOut, Plus, TrendingUp, Filter, MoreHorizontal, Activity, Circle, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '/SolaceHubLogo.jpeg';
import { useToast } from '../hooks/useToast.js';
import { useNavigate } from 'react-router-dom';
import DeceasedEntryForm from '../components/admin/DeceasedEntryForm.jsx';
import RegistriesTab from '../components/admin/RegistriesTab.jsx';
import ChitManagementTab from '../components/admin/ChitManagementTab.jsx';
import ReportsTab from '../components/admin/ReportsTab.jsx';
import ClientSettings from './ClientSettings.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { API_CONFIG, getAuthHeaders } from '../config/api.js';

function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeLedgerTab, setActiveLedgerTab] = useState('donation');
  const [activeSidebarLink, setActiveSidebarLink] = useState('Dashboard');
  const [showDeceasedForm, setShowDeceasedForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [deceasedEntries, setDeceasedEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [donationLedger, setDonationLedger] = useState([]);
  const [chitLedger, setChitLedger] = useState([]);
  const [activeOperators, setActiveOperators] = useState([]);
  const [recentPulse, setRecentPulse] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch donors for donation ledger
      const donorsResponse = await fetch(API_CONFIG.ENDPOINTS.DONORS, {
        headers: getAuthHeaders(),
      });
      if (donorsResponse.ok) {
        const donorsData = await donorsResponse.json();
        setDonationLedger(donorsData.results || donorsData || []);
      }

      // Fetch chits for chit ledger
      const chitsResponse = await fetch(API_CONFIG.ENDPOINTS.CHITS, {
        headers: getAuthHeaders(),
      });
      if (chitsResponse.ok) {
        const chitsData = await chitsResponse.json();
        setChitLedger(chitsData.results || chitsData || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'New Entry', icon: Plus },
    { name: 'Registries', icon: ClipboardList },
    { name: 'Chit Management', icon: Ticket },
    { name: 'Reports', icon: BarChart },
    { name: 'divider' },
    { name: 'Settings', icon: Settings },
    { name: 'Sign Out', icon: LogOut }
  ];

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

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
      addToast('Signed out successfully.', 'info', 2000);
      navigate('/login');
    }
  };

  const handleSaveDeceasedEntry = (entry) => {
    setDeceasedEntries([...deceasedEntries, entry]);
    setShowDeceasedForm(false);
    addToast('Deceased entry saved successfully.', 'success', 3000);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex">
      {/* Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-950 rounded-full flex items-center justify-center">
            <img src={logo} alt="SolaceHub" className="h-6 w-6 rounded-full object-cover" />
          </div>
          <span className="text-sm font-bold text-gray-900">SolaceHub</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`bg-slate-900 text-white border-r border-gray-200 fixed left-0 top-0 bottom-0 flex flex-col z-40 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-full flex items-center justify-center">
              <img src={logo} alt="SolaceHub" className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover" />
            </div>
            {!isSidebarCollapsed && <span className="text-base sm:text-lg font-bold text-white">SolaceHub</span>}
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg text-white lg:hidden"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:block p-2 hover:bg-slate-800 rounded-lg text-white"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        {!isSidebarCollapsed && <p className="text-xs text-slate-300 px-4 sm:px-6 pb-4 border-b border-gray-200">Admin Panel</p>}

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Active Terminal Card */}
          {!isSidebarCollapsed && (
            <div className="bg-emerald-900 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Circle size={10} className="text-green-400 fill-green-400" />
                <span className="text-xs text-emerald-200 uppercase tracking-wide">Active Terminal</span>
              </div>
              <p className="text-sm font-semibold text-white">Registry Desk</p>
              <p className="text-xs text-emerald-300">Terminal 01-A</p>
            </div>
          )}

          {/* Main Links */}
          <nav className="space-y-1">
            {sidebarLinks.map((link, index) => {
              if (link.name === 'divider') {
                return <div key={index} className="border-t border-gray-200 my-2"></div>;
              }
              if (link.name === 'Settings') {
                return (
                  <div key={link.name}>
                    {/* Notification Bell - Desktop Only */}
                    {!isSidebarCollapsed && (
                      <div className="hidden lg:block mb-2">
                        <NotificationBell
                          notifications={notifications}
                          onMarkAsRead={markAsRead}
                          onMarkAllAsRead={markAllAsRead}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors text-slate-300 hover:bg-slate-800`}
                      title={isSidebarCollapsed ? link.name : ''}
                    >
                      <link.icon size={18} />
                      {!isSidebarCollapsed && link.name}
                    </button>
                  </div>
                );
              }
              return (
                <button
                  key={link.name}
                  onClick={() => {
                    if (link.name === 'New Entry') {
                      setShowDeceasedForm(true);
                    } else if (link.name === 'Sign Out') {
                      handleLogout();
                    } else {
                      setActiveSidebarLink(link.name);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                    activeSidebarLink === link.name
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title={isSidebarCollapsed ? link.name : ''}
                >
                  <link.icon size={18} />
                  {!isSidebarCollapsed && link.name}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ml-0 lg:pt-0 pt-16 transition-all duration-300 overflow-x-hidden ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-4 sm:p-6">
          {/* Render different content based on active sidebar link */}
          {activeSidebarLink === 'Registries' ? (
            <RegistriesTab />
          ) : activeSidebarLink === 'Chit Management' ? (
            <ChitManagementTab />
          ) : activeSidebarLink === 'Reports' ? (
            <ReportsTab />
          ) : (
            <>
              {/* Analytics Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Total Donations</p>
              <div className="flex items-center gap-2 flex-nowrap">
                <p className="text-xl font-bold text-gray-900">GH₵ 45,230.00</p>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-medium">
                  <TrendingUp size={12} />
                  <span>+12%</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">from last hour</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Total Donors</p>
              <p className="text-3xl font-bold text-gray-900">142</p>
              <p className="text-xs text-gray-400 mt-2">Confirmed contributions</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Food Chits Issued</p>
              <p className="text-3xl font-bold text-gray-900">88</p>
              <p className="text-xs text-gray-400 mt-2">Active vouchers</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Guests Catered For</p>
              <p className="text-3xl font-bold text-gray-900">340</p>
              <p className="text-xs text-gray-400 mt-2">Cumulative guest count</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unified Ledger */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Unified Ledger</h2>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setActiveLedgerTab('donation')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeLedgerTab === 'donation'
                        ? 'bg-white text-indigo-950 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Donation Ledger
                  </button>
                  <button
                    onClick={() => setActiveLedgerTab('chit')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeLedgerTab === 'chit'
                        ? 'bg-white text-indigo-950 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Food Chit Ledger
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${activeLedgerTab === 'donation' ? 'donations' : 'chits'}...`}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950 bg-gray-50"
                  />
                </div>
                <button className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center sm:justify-start gap-2">
                  <Filter size={16} /> Filter
                </button>
              </div>

              <div className="w-full overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Receipt No.</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        {activeLedgerTab === 'donation' ? 'Donor Name' : 'Representative'}
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        {activeLedgerTab === 'donation' ? 'Amount (GH₵)' : 'Voucher Type'}
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Logged By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeLedgerTab === 'donation' ? donationLedger : chitLedger).map((entry, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-indigo-950">{entry.receiptNo}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{entry.donorName}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{entry.amount}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{entry.time}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{entry.loggedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side Panels */}
            <div className="space-y-6">
              {/* Active Operators */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Active Operators</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  {activeOperators.map((operator, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-indigo-950" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{operator.name}</p>
                        <p className="text-xs text-gray-500">{operator.role}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Circle size={6} className="text-green-500 fill-green-500" />
                        <span className="text-xs text-green-600 font-medium">{operator.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Pulse */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Recent Pulse</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Activity size={18} />
                  </button>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                  <div className="space-y-6">
                    {recentPulse.map((pulse, index) => (
                      <div key={index} className="relative flex items-start gap-3">
                        <div className="absolute -left-3.5 mt-1.5 w-2.5 h-2.5 rounded-full bg-indigo-950 ring-4 ring-white"></div>
                        <div className="flex-1 pl-2">
                          <p className="text-sm text-gray-900">{pulse.message}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pulse.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </main>
      </div>

      {/* Deceased Entry Form Modal */}
      {showDeceasedForm && (
        <DeceasedEntryForm 
          onClose={() => setShowDeceasedForm(false)} 
          onSave={handleSaveDeceasedEntry}
        />
      )}

      {/* Family Settings Modal */}
      {showSettings && (
        <FamilySettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default AdminDashboard;
