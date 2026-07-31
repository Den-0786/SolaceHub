import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Printer,
  User,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History,
  BarChart,
  Utensils,
  Minus,
  Plus as Add,
  Info,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import logo from "/SolaceHubLogo.jpeg";
import { useToast } from "../hooks/useToast.js";
import { useDeployment } from "../contexts/DeploymentContext";
import { useOwnerSettings } from "../hooks/useOwnerSettings.js";
import { useEvent } from "../contexts/EventContext.jsx";
import { API_CONFIG, fetchWithAuth } from "../config/api.js";

function ChitConsole() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { activeDeployment, setActiveDeployment } = useDeployment();
  const { activeEventId } = useEvent();
  const { settings, updateSettings } = useOwnerSettings();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showStaffLoginModal, setShowStaffLoginModal] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [voucherType, setVoucherType] = useState("full_meal");
  const [securityCode, setSecurityCode] = useState("CHIT-402");
  const [issuedToday, setIssuedToday] = useState(0);
  const [currentView, setCurrentView] = useState("desk");
  const [chitHistory, setChitHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const voucherTypes = [
    "Food & Soft Drink",
    "Food Only",
    "Beverage / Water Only",
    "VIP Package",
  ];

  const handleStaffLogin = () => {
    // Allow any name as operator name (no validation against credentials)
    if (staffName.trim()) {
      updateSettings({ chitOperatorName: staffName.trim() });
      setStaffName("");
      setShowStaffLoginModal(false);
      addToast('Operator added successfully', 'success');
    } else {
      addToast('Please enter an operator name', 'error');
    }
  };

  const handlePrintVoucher = useCallback(async () => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      addToast('Please login to issue chits', 'error');
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.CHITS, {
        method: 'POST',
        body: JSON.stringify({
          security_code: securityCode,
          representative_name: representativeName || "Guest",
          number_of_people: numberOfPeople,
          voucher_type: voucherType,
          event_day: 1,
        }),
      });

      if (response.ok) {
        const newChit = await response.json();
        setChitHistory((prev) => [newChit, ...prev]);
        setIssuedToday((prev) => prev + 1);

        // Add onafterprint handler to restore page
        const handleAfterPrint = () => {
          setRepresentativeName("");
          setNumberOfPeople(1);
          setVoucherType("full_meal");
          addToast("Chit issued successfully", "success");
          window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);

        // Small delay before print to ensure DOM is updated
        setTimeout(() => {
          window.print();
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Chit registration error:', errorData);
        if (response.status === 401) {
          addToast('Authentication failed. Please login again.', 'error');
          navigate('/login');
        } else {
          addToast(errorData.error || errorData.detail || `Failed to issue chit (${response.status})`, "error");
        }
      }
    } catch (err) {
      console.error('Chit registration error:', err);
      if (err.message === 'Session expired') {
        addToast('Session expired. Please login again.', 'error');
        navigate('/login');
      } else {
        addToast("Connection error. Please check your network.", "error");
      }
    }
  }, [securityCode, representativeName, numberOfPeople, voucherType, navigate, addToast]);

  const handleDecreasePeople = () => {
    if (numberOfPeople > 1) {
      setNumberOfPeople((prev) => prev - 1);
    }
  };

  const handleIncreasePeople = () => {
    setNumberOfPeople((prev) => prev + 1);
  };

  const handleGenerateNewCode = () => {
    const codeNumber = parseInt(securityCode.split("-")[1]) + 1;
    setSecurityCode(`CHIT-${codeNumber}`);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
      );
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
      addToast('Please login to access chit console', 'error', 3000);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [settings.sessionExpired, navigate, addToast]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handlePrintVoucher();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [representativeName, numberOfPeople, voucherType, handlePrintVoucher]);

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-indigo-900 text-white border-b border-indigo-200 px-4 py-4 md:py-5 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-start gap-3 md:gap-0">
          {/* Mobile Row 1 / Desktop Single Row */}
          <div className="flex items-center gap-4">
            {/* Hamburger menu button - mobile only */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-2 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold text-white">
              Food & Beverage Chit Desk
            </h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-full">
              Desk: Active
            </span>
          </div>

          {/* Mobile Row 2: Date, buttons / Desktop Same Row */}
          <div className="flex items-center justify-center md:justify-center md:flex-1 gap-8 md:gap-6">
            <span className="text-sm text-indigo-200">{currentDate}</span>
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/registry-console")}
                className="text-sm font-medium text-indigo-200 hover:text-white pb-1"
              >
                Donation
              </button>
              <button
                onClick={() => navigate("/chit-console")}
                className="text-sm font-medium text-white border-b-2 border-indigo-200 pb-1"
              >
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
        <aside
          className={`bg-indigo-900 text-white border-r border-indigo-200 pt-32 md:pt-20 px-4 pb-4 fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-40 ${isSidebarCollapsed ? "w-20" : "w-64"} ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="flex items-center justify-between mb-6 mt-4">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-800 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {settings.chitOperatorName || 'Operator'}
                  </p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg"
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          <nav className="space-y-2 mb-6">
            {[
              { name: "Chit Desk", icon: Utensils, view: "desk" },
              { name: "Chit Logs", icon: History, view: "logs" },
              { name: "Chit Analytics", icon: BarChart, view: "analytics" },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setCurrentView(item.view);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 ${currentView === item.view ? "border-2 border-indigo-200 text-white bg-indigo-800" : "text-indigo-200 hover:bg-indigo-800"}`}
              >
                {isSidebarCollapsed ? (
                  <span className="text-center w-full">
                    {item.icon ? <item.icon size={16} /> : "C"}
                  </span>
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
              <button
                onClick={() => setShowStaffLoginModal(true)}
                className="w-full border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Desk Operator Login
              </button>
            )}
            {isSidebarCollapsed && (
              <button
                onClick={() => setShowStaffLoginModal(true)}
                className="w-full border-2 border-white text-white py-3 rounded-lg text-sm font-medium hover:bg-white/10 flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            )}
            {!isSidebarCollapsed && (
              <button
                onClick={() => {
                  addToast("Session synced. Signing out...", "info", 2000);
                  setTimeout(() => navigate("/login"), 800);
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> END SESSION & SYNC
              </button>
            )}
            {isSidebarCollapsed && (
              <button
                onClick={() => {
                  addToast("Session synced. Signing out...", "info", 2000);
                  setTimeout(() => navigate("/login"), 800);
                }}
                className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main
          className={`flex-1 p-6 overflow-y-auto mt-28 md:mt-20 mb-12 transition-all duration-300 ml-0 md:${isSidebarCollapsed ? "ml-20" : "ml-64"} ${isSidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}
        >
          {currentView === "desk" && (
            <>
              {/* Page Header with Session Counter */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Main Text - Full Row */}
                <h2 className="text-2xl font-bold text-indigo-900">
                  Food & Beverage Chit Desk
                </h2>

                {/* Sub Text - Full Row */}
                <p className="text-indigo-500">
                  Issue and manage refreshment vouchers for guests.
                </p>

                {/* White Card with Session Counter */}
                <div className="bg-white rounded-xl shadow-sm border border-indigo-200 px-6 py-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-indigo-500 font-medium">
                        CURRENT SESSION
                      </p>
                      <p className="text-sm text-indigo-600">Issued Today</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-900">
                        {issuedToday}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Issue Food & Drink Voucher Form */}
                <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Utensils size={24} className="text-indigo-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-indigo-900">
                        Issue Food & Drink Voucher
                      </h3>
                      <p className="text-sm text-indigo-500">
                        Create refreshment vouchers for guests
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                        Representative Name
                      </label>
                      <input
                        type="text"
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        placeholder="e.g. Representative Name"
                        className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                        Number of People
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleDecreasePeople}
                          className="w-12 h-12 border-2 border-indigo-200 rounded-lg flex items-center justify-center hover:bg-indigo-100"
                        >
                          <Minus size={20} />
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-4xl font-bold text-indigo-900">
                            {numberOfPeople}
                          </span>
                        </div>
                        <button
                          onClick={handleIncreasePeople}
                          className="w-12 h-12 border-2 border-indigo-200 rounded-lg flex items-center justify-center hover:bg-indigo-100"
                        >
                          <Add size={20} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                        Voucher Type
                      </label>
                      <select
                        value={voucherType}
                        onChange={(e) => setVoucherType(e.target.value)}
                        className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-900"
                      >
                        {voucherTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handlePrintVoucher}
                      className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <Printer size={20} /> Print Voucher (Ctrl+Enter)
                    </button>

                    <div className="bg-accent-50/50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Info size={16} className="text-accent-700 mt-0.5" />
                      <p className="text-sm text-indigo-700">
                        Each chit contains a unique single-use security code.
                        Please verify the representative's ID for high-count
                        vouchers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Thermal Chit Live Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4">
                    Live Thermal Chit Preview
                  </h3>

                  {/* Thermal Receipt Container */}
                  <div
                    className="bg-indigo-50 rounded-lg p-6 mb-4"
                    style={{ maxWidth: "240px", margin: "0 auto" }}
                  >
                    <div className="bg-white p-4 text-center">
                      {/* Top Header */}
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full overflow-hidden">
                          {activeDeployment?.deceased_image ? (
                            <img
                              src={activeDeployment.deceased_image}
                              alt="Deceased"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={logo}
                              alt="Deceased"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600">FUNERAL OF</p>
                      <h4 className="text-sm font-bold text-indigo-900">
                        {activeDeployment?.deceased_name || activeDeployment?.title || "Event"}
                      </h4>
                      {activeDeployment?.deceased_age && (
                        <p className="text-xs text-gray-500">Age: {activeDeployment.deceased_age}</p>
                      )}
                      {activeDeployment?.id && (
                        <p className="text-xs text-gray-400">
                          Event ID: #{activeDeployment.id}
                        </p>
                      )}

                      {/* Central Ticket Box */}
                      <div className="bg-black text-white text-center p-6 my-4 rounded-md">
                        <p className="text-xs font-medium">REFRESHMENT CHIT</p>
                        <Utensils size={32} className="mx-auto my-2" />
                        <p className="text-xs">GUESTS</p>
                        <p className="text-3xl font-bold">{numberOfPeople}</p>
                      </div>

                      {/* Metadata */}
                      <div className="border-t border-dashed border-indigo-300 pt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-600">ISSUED TO</span>
                          <span className="font-medium text-indigo-900">
                            {representativeName || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-600">TYPE</span>
                          <span className="font-medium text-indigo-900">
                            {voucherType}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-600">SECURITY CODE</span>
                          <span className="font-medium text-indigo-900">
                            {securityCode}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-indigo-600">ISSUED BY</span>
                          <span className="font-medium text-indigo-900">
                            {settings.chitOperatorName || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Barcode Section */}
                      <div className="border-t border-dashed border-indigo-300 mt-3 pt-3">
                        <div className="bg-indigo-100 h-8 flex items-center justify-center mb-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                              <div key={i} className="w-0.5 h-6 bg-black"></div>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-indigo-600">
                          {currentDate} | {currentTime}
                        </p>
                        <p className="text-xs font-bold text-indigo-900 mt-1">
                          VALID FOR SINGLE-USE TODAY ONLY.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Tools */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    <button className="border border-indigo-200 text-indigo-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2 whitespace-nowrap">
                      <Search size={16} /> Magnify
                    </button>
                    <button
                      onClick={handleGenerateNewCode}
                      className="border border-indigo-200 text-indigo-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <RotateCcw size={16} /> Generate New Code
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentView === "logs" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Chit Logs
              </h2>
              <p className="text-gray-600 mb-6">
                History of issued refreshment chits for this session.
              </p>
              <div className="w-full overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Security Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Representative
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Guests
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {chitHistory.map((chit) => (
                      <tr key={chit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {chit.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {chit.representative}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {chit.guests}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {chit.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {chit.time}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {chit.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Chit Analytics
                </h2>
                <p className="text-gray-600">
                  Overview of refreshment chit issuance and distribution.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600">
                    Total Chits Issued Today
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {issuedToday}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600">Total Guests Served</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {chitHistory.reduce((sum, chit) => sum + chit.guests, 0)}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <p className="text-sm text-gray-600">Average Guests / Chit</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(
                      chitHistory.reduce((sum, chit) => sum + chit.guests, 0) /
                      chitHistory.length
                    ).toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Chit Type Distribution
                </h3>
                <div className="space-y-3">
                  {voucherTypes.map((type) => {
                    const count = chitHistory.filter(
                      (chit) => chit.type === type,
                    ).length;
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">{type}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-amber-600 h-2 rounded-full"
                              style={{
                                width: `${(count / chitHistory.length) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-6">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentView === "settings" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Chit Settings
              </h2>
              <p className="text-gray-600">
                Configure chit desk preferences, voucher types, and printer
                settings.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className={`bg-slate-900 text-slate-300 px-4 sm:px-6 py-3 border-t border-slate-800 fixed bottom-0 right-0 transition-all duration-300 left-0 lg:${isSidebarCollapsed ? 'left-20' : 'left-64'} z-50`}>
        <div className="flex justify-between items-center text-[10px] sm:text-xs">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-slate-400">PENDING PRINT:</span>
              <span className="font-bold text-white">01</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-slate-400">AVG TIME / ISSUANCE:</span>
              <span className="font-bold text-white">1.2s</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-green-500">PRINTER ONLINE</span>
          </div>
        </div>
      </footer>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-indigo-50, .bg-indigo-50 * {
            visibility: visible;
          }
          .bg-indigo-50 {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
          }
        }
      `}</style>

      {/* Desk Operator Login Modal */}
      {showStaffLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Operator</h3>
              <button
                onClick={() => setShowStaffLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleStaffLogin(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Enter operator name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStaffLoginModal(false)}
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

export default ChitConsole;
