import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Share2, Settings, User, Plus, ArrowUp, LogOut, ChevronLeft, ChevronRight, History, BarChart, LayoutDashboard, X, Menu } from 'lucide-react';
import logo from '/SolaceHubLogo.jpeg';
import { useToast } from '../hooks/useToast.js';
import { useDeployment } from '../contexts/DeploymentContext';
import { useOwnerSettings } from '../hooks/useOwnerSettings.js';
import { useEvent } from '../contexts/EventContext.jsx';
import { API_CONFIG, fetchWithAuth } from '../config/api.js';

function RegistryConsole() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { activeDeployment, setActiveDeployment } = useDeployment();
  const { settings, updateSettings } = useOwnerSettings();
  const { activeEventId } = useEvent();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+233');
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [currentView, setCurrentView] = useState('desk');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-logout when session expires
  useEffect(() => {
    if (settings.sessionExpired) {
      addToast('Session expired. Logging out...', 'warning', 3000);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      addToast('Please login to access registry console', 'error', 3000);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [settings.sessionExpired, navigate, addToast]);

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    fetchDeploymentForEvent();
  }, [activeEventId]);

  const fetchDeploymentForEvent = async () => {
    if (!activeEventId) return;
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DEPLOYMENTS);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setActiveDeployment(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch deployment:', err);
    }
  };

  const fetchDonors = async () => {
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DONORS);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
        setTotalAmount(data.reduce((sum, d) => sum + d.amount, 0));
        setEntryCount(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch donors:', err);
    }
  };

  const handlePrint = async () => {
    const newAmount = parseFloat(amount) || 0;
    
    if (newAmount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DONORS, {
        method: 'POST',
        body: JSON.stringify({
          donor_name: donorName || 'Anonymous',
          phone_number: phoneNumber,
          amount: newAmount,
          receipt_id: `FP-${String(transactions.length + 1).padStart(4, '0')}`,
          time: currentTime,
          method: 'Cash',
          event_day: 1,
        }),
      });

      if (response.ok) {
        const newDonor = await response.json();
        setTransactions([newDonor, ...transactions].slice(0, 5));
        setTotalAmount(prev => prev + newAmount);
        setEntryCount(prev => prev + 1);

        // Add onafterprint handler to restore page
        const handleAfterPrint = () => {
          setDonorName('');
          setAmount('');
          setPhoneNumber('+233');
          addToast('Donor registered successfully', 'success');
          window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);

        // Small delay before print to ensure DOM is updated
        setTimeout(() => {
          window.print();
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Donor registration error:', errorData);
        addToast(errorData.error || errorData.detail || `Failed to register donor (${response.status})`, 'error');
      }
    } catch (err) {
      console.error('Donor registration error:', err);
      if (err.message === 'Session expired') {
        addToast('Session expired. Please login again.', 'error');
        navigate('/login');
      } else {
        addToast('Connection error. Please check your network.', 'error');
      }
    }
  };

  const handleDigitalSend = () => {
    // Handle WhatsApp/SMS sending logic
    alert('Digital receipt sent to ' + phoneNumber);
  };

  const handleManualReprint = () => {
    window.print();
  };

  const formatAmount = (value) => {
    if (!value) return 'GH₵ 0.00';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    if (isNaN(num)) return 'GH₵ 0.00';
    // Round to avoid floating-point precision issues
    const rounded = Math.round(num * 100) / 100;
    return `GH₵ ${rounded.toFixed(2)}`;
  };

  const formatAmountForDisplay = (value) => {
    if (!value) return 'GH₵ 0.00';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    if (isNaN(num)) return 'GH₵ 0.00';
    // Round to avoid floating-point precision issues
    const rounded = Math.round(num * 100) / 100;
    return `GH₵ ${rounded.toFixed(2)}`;
  };

  const handleAmountChange = (e) => {
    let value = e.target.value;
    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');
    // Allow only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setAmount(value);
  };

  const handleVisitorRegistration = (e) => {
    e.preventDefault();

    // Allow any name as operator name (no validation against credentials)
    if (visitorName.trim()) {
      updateSettings({ donationOperatorName: visitorName.trim() });
      setVisitorName('');
      setShowRegistrationForm(false);
      addToast('Operator added successfully', 'success');
    } else {
      addToast('Please enter an operator name', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-brand-900 text-white border-b border-brand-200 px-4 py-4 md:py-5 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#0F172A' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-start gap-3 md:gap-0">
          {/* Mobile Row 1 / Desktop Single Row */}
          <div className="flex items-center gap-4">
            {/* Hamburger menu button - mobile only */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-2 text-brand-200 hover:text-white hover:bg-brand-800 rounded-lg"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold text-white">Memorial Registry Console</h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-full">Desk: Active</span>
          </div>

          {/* Mobile Row 2: Date, buttons / Desktop Same Row */}
          <div className="flex items-center justify-center md:justify-center md:flex-1 gap-8 md:gap-6">
            <span className="text-sm text-brand-200">{currentDate}</span>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/registry-console')} className="text-sm font-medium text-white border-b-2 border-brand-200 pb-1">
                Donation
              </button>
              <button onClick={() => navigate('/chit-console')} className="text-sm font-medium text-brand-200 hover:text-white pb-1">
                Chit
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside className={`bg-brand-900 text-white border-r border-brand-200 pt-32 md:pt-20 px-4 pb-4 fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-40 ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`} style={{ backgroundColor: '#0F172A' }}>
          <div className="flex items-center justify-between mb-6 mt-4">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-800 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{settings.donationOperatorName || 'Operator'}</p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 text-brand-200 hover:text-white hover:bg-brand-800 rounded-lg"
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          
          <nav className="space-y-2 mb-6">
            {[
              { name: 'Registry Desk', icon: LayoutDashboard, view: 'desk' },
              { name: 'Historical Logs', icon: History, view: 'logs' },
              { name: 'Analytics', icon: BarChart, view: 'analytics' }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setCurrentView(item.view);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 ${currentView === item.view ? 'border-2 border-brand-200 text-white bg-brand-800' : 'text-brand-200 hover:bg-brand-800'}`}
              >
                {isSidebarCollapsed ? (
                  <span className="text-center w-full">{item.icon ? <item.icon size={16} /> : 'R'}</span>
                ) : (
                  <>
                    {item.icon && <item.icon size={16} />}
                    {item.name}
                  </>
                )}
              </button>
            ))}
          </nav>
          
          <div className="space-y-3">
            {!isSidebarCollapsed && (
              <button onClick={() => setShowRegistrationForm(true)} className="w-full border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 flex items-center justify-center gap-2">
                <Plus size={16} /> Desk Operator Login
              </button>
            )}
            {isSidebarCollapsed && (
              <button onClick={() => setShowRegistrationForm(true)} className="w-full border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 flex items-center justify-center">
                <Plus size={16} />
              </button>
            )}
            {!isSidebarCollapsed && (
              <button
                onClick={() => {
                  addToast('Session synced. Signing out...', 'info', 2000);
                  setTimeout(() => navigate('/login'), 800);
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> END SESSION & SYNC
              </button>
            )}
            {isSidebarCollapsed && (
              <button
                onClick={() => {
                  addToast('Session synced. Signing out...', 'info', 2000);
                  setTimeout(() => navigate('/login'), 800);
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className={`flex-1 p-6 overflow-y-auto mt-28 md:mt-20 ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          {currentView === 'desk' && (
              <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Hero Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Picture - centered, rounded, moved up */}
                  <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
                    {activeDeployment?.deceased_image ? (
                      <img src={activeDeployment.deceased_image} alt="Deceased" className="w-full h-full object-cover" />
                    ) : (
                      <img src={logo} alt="Deceased" className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  {/* Name - full row */}
                  <h2 className="text-2xl font-bold text-gray-900 text-center">In Loving Memory of {activeDeployment?.title || activeDeployment?.event_title || 'Event'}</h2>
                  
                  {/* Date of birth */}
                  <p className="text-gray-600 text-center">{activeDeployment?.dates || 'Dates not set'}</p>
                  
                  {/* Time and Active Reader */}
                  <div className="flex items-center gap-6">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active Desk</span>
                    <p className="text-3xl font-bold text-gray-900">{currentTime}</p>
                  </div>
                  
                  {activeDeployment?.id && (
                    <p className="text-xs text-gray-400 text-center">Event ID: #{activeDeployment.id}</p>
                  )}
                </div>
              </div>

              {/* Today's Total Summary - Full width after hero card */}
              <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 rounded-xl p-6 text-white">
                <h4 className="text-sm font-medium opacity-80 mb-2">Today's Total</h4>
                <p className="text-3xl font-bold">GH₵ {totalAmount.toLocaleString()}.00</p>
                <p className="text-sm opacity-80 mt-1">{entryCount} Entries processed</p>
                <div className="flex items-center gap-1 mt-2 text-green-400">
                  <ArrowUp size={16} />
                  <span className="text-sm">Live tracking active</span>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Contribution Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Record New Contribution</h3>
                  
                  <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
                        <input
                          type="text"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          placeholder="Enter full name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (GHC)</label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-950"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+233"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950"
                        />
                      </div>
                      
                      <button
                        onClick={handlePrint}
                        className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Printer size={20} /> Print & Submit Receipt
                      </button>
                    </div>
                  </div>

                {/* Right Column - Thermal Receipt Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Live Thermal Receipt Preview</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-4" style={{ maxWidth: '320px' }}>
                    <div className="bg-white p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {activeDeployment?.deceased_image ? (
                          <img src={activeDeployment.deceased_image} alt="Deceased" className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          <img src={logo} alt="SolaceHub" className="h-8 w-8 rounded-full" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">FUNERAL DONATION RECEIPT</h4>
                      <p className="text-xs text-gray-600">In Memory of</p>
                      <p className="text-sm font-bold text-gray-900">{activeDeployment?.deceased_name || activeDeployment?.title || activeDeployment?.event_title || 'Event'}</p>
                      {activeDeployment?.deceased_age && (
                        <p className="text-xs text-gray-500">Age: {activeDeployment.deceased_age}</p>
                      )}
                      {activeDeployment?.id && (
                        <p className="text-xs text-gray-400">Event ID: #{activeDeployment.id}</p>
                      )}
                      <div className="border-t border-dashed border-gray-300 my-2"></div>
                      <p className="text-xs text-gray-600">Receipt #: FP-{String(transactions.length + 1).padStart(4, '0')}</p>
                      <p className="text-xs text-gray-600">{currentDate} {currentTime}</p>
                      <div className="border-t border-dashed border-gray-300 my-2"></div>
                      <p className="text-xs font-medium text-gray-700">DONOR NAME</p>
                      <p className="text-sm font-bold text-gray-900">{donorName || 'Guest'}</p>
                      <p className="text-xs font-medium text-gray-700 mt-2">AMOUNT RECEIVED</p>
                      <p className="text-lg font-bold text-gray-900">{formatAmountForDisplay(amount)}</p>
                      <div className="border-t border-dashed border-gray-300 my-2"></div>
                      <p className="text-xs text-gray-600 italic">Thank you for your kind donation & support during this time of mourning. Your generosity is deeply appreciated by the bereaved family.</p>
                      <p className="text-xs text-gray-400 mt-2">Issued by: {settings.donationOperatorName || 'Operator'}</p>
                      <div className="border-t border-dashed border-gray-300 my-2"></div>
                      <p className="text-xs text-gray-400">System-Generated Document</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleManualReprint}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      <Printer size={16} /> Ctrl+P Manual Reprint
                    </button>
                    <button
                      onClick={handleDigitalSend}
                      className="flex-1 bg-indigo-950 text-white py-3 rounded-lg text-sm font-medium hover:bg-indigo-900 flex items-center justify-center gap-2"
                    >
                      <Share2 size={16} /> Digital Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                
                <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[175px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Receipt ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Donor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Time & Method</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Issued By</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{transaction.receipt_id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User size={16} className="text-indigo-950" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{transaction.donor_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{transaction.time} • {transaction.method}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">GH₵ {(Math.round(transaction.amount * 100) / 100).toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{transaction.logged_by_name || settings.donationOperatorName || 'Operator'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">{transaction.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}

          {currentView === 'logs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Historical Logs</h2>
              <p className="text-gray-600 mb-6">Complete history of donations and contributions recorded at this registry desk.</p>
              <div className="w-full overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full min-w-[150px] text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{transaction.receipt_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{transaction.donor_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.time}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.method}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">GH₵ {(Math.round(transaction.amount * 100) / 100).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.logged_by_name || settings.donationOperatorName || 'Operator'}</td>
                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{transaction.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registry Analytics</h2>
                <p className="text-gray-600">Overview of donation collection and registry performance.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600">Total Collected Today</p>
                  <p className="text-3xl font-bold text-gray-900">GH₵ {totalAmount.toLocaleString()}.00</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-3xl font-bold text-gray-900">{entryCount}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600">Average Donation</p>
                  <p className="text-3xl font-bold text-gray-900">GH₵ {(totalAmount / entryCount).toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method Distribution</h3>
                <div className="space-y-3">
                  {['Cash', 'Mobile Money'].map(method => {
                    const count = transactions.filter(t => t.method === method).length;
                    return (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{method}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-indigo-950 h-2 rounded-full" style={{ width: `${(count / transactions.length) * 100}%` }}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-6">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Registry Settings</h2>
              <p className="text-gray-600">Configure registry desk preferences, receipt templates, and printer settings.</p>
            </div>
          )}
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-gray-50, .bg-gray-50 * {
            visibility: visible;
          }
          .bg-gray-50 {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>

      {/* Staff Login Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Operator</h3>
              <button onClick={() => setShowRegistrationForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVisitorRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operator Name</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Enter operator name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegistrationForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-950 text-white py-2 rounded-lg font-medium hover:bg-indigo-900"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistryConsole;
