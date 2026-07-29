import { useState } from 'react';
import { Plus, Wifi, Battery, Printer, Tablet, CheckCircle, AlertCircle, Settings, MapPin, Phone, User } from 'lucide-react';
import ManageDeploymentModal from './ManageDeploymentModal.jsx';
import { useDeployment } from '../../contexts/DeploymentContext';

export default function DeploymentTab({ deployments, setDeployments, hardwareInventory, setHardwareInventory }) {
  const { setActiveDeployment } = useDeployment();
  const [showModal, setShowModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [activeTab, setActiveTab] = useState('deployments');
  
  // New deployment form state
  const [newDeployment, setNewDeployment] = useState({
    title: '',
    venue: '',
    client: '',
    phone: '',
    selectedTablets: [],
    selectedDonationPrinter: '',
    selectedChitPrinter: '',
    roleMapping: 'Donation Desk'
  });

  const hardwareStatus = [
    { id: 1, name: 'Primary Desk Tablet', status: 'Online', battery: 78, ip: '192.168.1.101' },
    { id: 2, name: 'Thermal Printer A (Donation)', status: 'Ready', battery: null, ip: '192.168.1.102' },
    { id: 3, name: 'Thermal Printer B (Chit)', status: 'Ready', battery: null, ip: '192.168.1.103' },
    { id: 4, name: 'Secondary Tablet (Registry)', status: 'Offline', battery: 45, ip: '192.168.1.104' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-accent-50 text-accent-700 border border-amber-200',
      'Active': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Attended': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Rejected': 'bg-red-50 text-red-700 border border-red-200',
    };
    return styles[status] || 'bg-brand-100 text-brand-600 border border-brand-200';
  };

  const getHardwareStatusBadge = (status) => {
    const styles = {
      'Available': 'bg-green-100 text-green-800 border-green-200',
      'In Use': 'bg-amber-100 text-amber-800 border-amber-200',
      'Maintenance': 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const updateHardwareStatus = (hardwareId, status, eventId = null) => {
    setHardwareInventory(prev => prev.map(item => {
      if (item.id === hardwareId) {
        return { ...item, status, assigned_event_id: eventId };
      }
      return item;
    }));
  };

  const handleUpdateStatus = (deploymentId, newStatus, newHardware = null) => {
    setDeployments(prev => prev.map(dep => {
      if (dep.id === deploymentId) {
        if (newStatus === 'Attended' || newStatus === 'Rejected') {
          dep.hardware.forEach(hardwareId => {
            updateHardwareStatus(hardwareId, 'Available', null);
          });
          return { ...dep, hardware: [], status: newStatus };
        }
        if (newHardware) {
          return { ...dep, hardware: newHardware, status: newStatus };
        }
        return { ...dep, status: newStatus };
      }
      return dep;
    }));
  };

  const handleManageDeployment = (deployment) => {
    setSelectedDeployment(deployment);
    setActiveDeployment(deployment);
  };

  const handleRegisterDeployment = () => {
    try {
      const newId = Math.max(...deployments.map(d => d.id), 0) + 1;
      const selectedHardware = [
        ...newDeployment.selectedTablets,
        newDeployment.selectedDonationPrinter,
        newDeployment.selectedChitPrinter
      ].filter(h => h);

      selectedHardware.forEach(hardwareId => {
        updateHardwareStatus(hardwareId, 'In Use', newId);
      });

      const deployment = {
        id: newId,
        title: newDeployment.title,
        venue: newDeployment.venue,
        client: newDeployment.client,
        phone: newDeployment.phone,
        hardware: selectedHardware,
        roleMapping: newDeployment.roleMapping,
        status: 'Pending'
      };

      setDeployments(prev => [...prev, deployment]);
      setShowModal(false);

      setNewDeployment({
        title: '',
        venue: '',
        client: '',
        phone: '',
        selectedTablets: [],
        selectedDonationPrinter: '',
        selectedChitPrinter: '',
        roleMapping: 'Donation Desk'
      });
    } catch (error) {
      console.error('Error creating deployment:', error);
    }
  };

  // Responsive table component for deployments
  const DeploymentCard = ({ deployment }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{deployment.title}</h4>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="shrink-0" /> {deployment.venue}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${getStatusBadge(deployment.status)}`}>
          {deployment.status}
        </span>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500 font-semibold">Client</p>
          <p className="text-gray-900 font-medium flex items-center gap-1">
            <User size={12} /> {deployment.client}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Phone</p>
          <p className="text-gray-900 font-medium flex items-center gap-1">
            <Phone size={12} /> {deployment.phone}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Hardware</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {deployment.hardware.length > 0 ? (
              deployment.hardware.map(hwId => {
                const hw = hardwareInventory.find(h => h.id === hwId);
                return hw ? (
                  <span key={hwId} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                    {hw.id}
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-gray-400">No hardware</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Role Mapping</p>
          <p className="text-gray-900">{deployment.roleMapping}</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button 
          onClick={() => handleManageDeployment(deployment)}
          className="w-full text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center justify-center gap-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <Settings size={14} /> Manage Deployment
        </button>
      </div>
    </div>
  );

  const hardwareCardStyles = [
    { bg: 'bg-white', border: 'border-gray-200', nameText: 'text-gray-900', subText: 'text-gray-500', icon: 'text-gray-600' },
    { bg: 'bg-gray-100', border: 'border-gray-200', nameText: 'text-gray-900', subText: 'text-gray-600', icon: 'text-gray-600' },
    { bg: 'bg-slate-900', border: 'border-slate-700', nameText: 'text-white', subText: 'text-slate-300', icon: 'text-slate-300' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', nameText: 'text-indigo-900', subText: 'text-indigo-700', icon: 'text-indigo-600' }
  ];

  // Responsive hardware card for mobile
  const HardwareCard = ({ item, index }) => {
    const style = hardwareCardStyles[index % hardwareCardStyles.length];
    return (
      <div className={`border rounded-xl p-4 hover:border-indigo-300 transition-colors ${style.bg} ${style.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {item.name.includes('Tablet') ? <Tablet size={16} className={`${style.icon} shrink-0`} /> : <Printer size={16} className={`${style.icon} shrink-0`} />}
            <span className={`font-medium text-sm truncate ${style.nameText}`}>{item.name}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${item.status === 'Online' || item.status === 'Ready' ? 'text-green-600' : 'text-gray-500'}`}>
            {item.status === 'Online' || item.status === 'Ready' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            {item.status}
          </div>
        </div>
        <div className="space-y-1.5">
          {item.battery !== null && (
            <div className={`flex items-center gap-2 text-xs ${style.subText}`}>
              <Battery size={12} className="shrink-0" />
              <span className="truncate">{item.battery}% Battery</span>
            </div>
          )}
          <div className={`flex items-center gap-2 text-xs ${style.subText}`}>
            <Wifi size={12} className="shrink-0" />
            <span className="truncate">{item.ip}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Page Title */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Hardware & Venue Deployments</h2>
        <p className="text-sm md:text-base text-gray-500">Manage hardware inventory and active event assignments</p>
      </div>

      {/* Action Bar - Mobile Responsive */}
      <style>
        {`@media (max-width: 639px) {
          .action-bar-scroll {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            width: 100% !important;
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }`}
      </style>
      <div className="mb-4 md:mb-6 action-bar-scroll">
        <div className="flex gap-2 md:gap-3" style={{ display: 'inline-flex', minWidth: '100%' }}>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`shrink-0 whitespace-nowrap px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-colors ${
              activeTab === 'deployments'
                ? 'bg-indigo-950 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active Deployments
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`shrink-0 whitespace-nowrap px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'bg-indigo-950 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Hardware Stockroom
          </button>
          {activeTab === 'deployments' && (
            <button
              onClick={() => setShowModal(true)}
              className="shrink-0 whitespace-nowrap px-3 py-2 md:px-4 md:py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs md:text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Register New Deployment
            </button>
          )}
        </div>
      </div>

      {/* Hardware Stockroom - Mobile Responsive */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 overflow-x-hidden">
          <div className="mb-4">
            <h3 className="text-base md:text-lg font-bold text-gray-900">Hardware Stockroom Manager</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs font-medium">
                {hardwareInventory.filter(h => h.status === 'Available').length} Available
              </span>
              <span className="bg-amber-100 text-amber-800 px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs font-medium">
                {hardwareInventory.filter(h => h.status === 'In Use').length} In Use
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs font-medium">
                {hardwareInventory.filter(h => h.status === 'Maintenance').length} Maintenance
              </span>
            </div>
          </div>
          
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {hardwareInventory.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.type}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${getHardwareStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {item.assigned_event_id ? `Event #${item.assigned_event_id}` : 'Not assigned'}
                </p>
              </div>
            ))}
          </div>
          
          {/* Desktop table view */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Hardware ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Device Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Assigned Event</th>
                </tr>
              </thead>
              <tbody>
                {hardwareInventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono font-medium text-gray-900">{item.id}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.type}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getHardwareStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.assigned_event_id ? `Event #${item.assigned_event_id}` : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deployments Tab */}
      {activeTab === 'deployments' && (
        <>
          {/* Hardware Diagnostic - Responsive Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 mb-4 md:mb-6 overflow-x-hidden">
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wifi size={18} className="text-indigo-600" />
                Hardware Diagnostic Status
              </h3>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 inline-block mt-2">
                <p className="text-xs text-indigo-600 font-medium">Active Hardware Stations</p>
                <p className="text-lg font-bold text-indigo-900">{hardwareInventory.filter(h => h.status === 'In Use').length}</p>
              </div>
            </div>
            <style>
              {`@media (min-width: 640px) {
                .hardware-diagnostics-scroll {
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                }
                .hardware-diagnostics-grid {
                  min-width: 0 !important;
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (min-width: 1024px) {
                .hardware-diagnostics-grid {
                  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 639px) {
                .hardware-diagnostics-scroll {
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
            <div className="hardware-diagnostics-scroll" style={{ width: '100%', overflowX: 'auto' }}>
              <div className="hardware-diagnostics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', minWidth: '1040px', gap: '12px' }}>
                {hardwareStatus.map((item, index) => (
                  <HardwareCard key={item.id} item={item} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* Active Deployments - Mobile Responsive */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 overflow-x-hidden">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Active Deployments</h3>
            
            {/* Mobile card view */}
            <div className="hidden">
              {deployments.map((deployment) => (
                <DeploymentCard key={deployment.id} deployment={deployment} />
              ))}
              {deployments.length === 0 && (
                <p className="text-center text-gray-500 py-8">No deployments found</p>
              )}
            </div>

            {/* Desktop table view */}
            <style>
              {`@media (min-width: 640px) {
                .deployments-table-scroll {
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
                }
              }
              @media (max-width: 639px) {
                .deployments-table-scroll {
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
            <div className="deployments-table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '800px', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Event & Venue</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hardware Kit</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Role Mapping</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((deployment) => (
                    <tr key={deployment.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 text-sm">{deployment.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={12} /> {deployment.venue}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <User size={14} /> {deployment.client}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-xs text-gray-500">
                          {deployment.phone.replace('+233 ', '0').replace('+233', '0')}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-xs text-gray-700">
                          {deployment.hardware.length > 0 ? (
                            deployment.hardware.map(hwId => {
                              const hw = hardwareInventory.find(h => h.id === hwId);
                              return hw ? hw.id : null;
                            }).filter(Boolean).join('/')
                          ) : (
                            <span className="text-gray-400">No hardware assigned</span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{deployment.roleMapping}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(deployment.status)}`}>
                          {deployment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleManageDeployment(deployment)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center gap-1"
                        >
                          <Settings size={14} /> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal - Completely Responsive */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-2 sm:mx-4 p-3 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Register New Deployment</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-1 text-2xl sm:text-xl">
                ×
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
                <input 
                  type="text" 
                  value={newDeployment.title}
                  onChange={(e) => setNewDeployment({...newDeployment, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base" 
                  placeholder="Enter event name" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue Location</label>
                <input 
                  type="text" 
                  value={newDeployment.venue}
                  onChange={(e) => setNewDeployment({...newDeployment, venue: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base" 
                  placeholder="Enter venue" 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
                  <input 
                    type="text" 
                    value={newDeployment.client}
                    onChange={(e) => setNewDeployment({...newDeployment, client: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base" 
                    placeholder="Client name" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    value={newDeployment.phone}
                    onChange={(e) => setNewDeployment({...newDeployment, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base" 
                    placeholder="+233..." 
                  />
                </div>
              </div>
              
              {/* Hardware Selection - Mobile Responsive */}
              <div className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Tablet size={16} className="text-indigo-600" />
                  Hardware Assignment
                </h4>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* Tablet Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Select Assigned Tablet(s)</label>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
                      {hardwareInventory.filter(h => h.type === 'Tablet' && h.status === 'Available').map(tablet => (
                        <label key={tablet.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300">
                          <input
                            type="checkbox"
                            checked={newDeployment.selectedTablets.includes(tablet.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewDeployment({...newDeployment, selectedTablets: [...newDeployment.selectedTablets, tablet.id]});
                              } else {
                                setNewDeployment({...newDeployment, selectedTablets: newDeployment.selectedTablets.filter(id => id !== tablet.id)});
                              }
                            }}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tablet.name}</p>
                            <p className="text-xs text-gray-500">{tablet.id}</p>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">Available</span>
                        </label>
                      ))}
                      {hardwareInventory.filter(h => h.type === 'Tablet' && h.status === 'Available').length === 0 && (
                        <p className="text-xs text-gray-500 italic">No available tablets</p>
                      )}
                    </div>
                  </div>

                  {/* Printer Selections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Donation Printer</label>
                      <select
                        value={newDeployment.selectedDonationPrinter}
                        onChange={(e) => setNewDeployment({...newDeployment, selectedDonationPrinter: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">-- Select --</option>
                        {hardwareInventory.filter(h => h.type === 'Thermal Printer' && h.status === 'Available').map(printer => (
                          <option key={printer.id} value={printer.id}>{printer.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Chit Printer</label>
                      <select
                        value={newDeployment.selectedChitPrinter}
                        onChange={(e) => setNewDeployment({...newDeployment, selectedChitPrinter: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">-- Select --</option>
                        {hardwareInventory.filter(h => h.type === 'Thermal Printer' && h.status === 'Available').map(printer => (
                          <option key={printer.id} value={printer.id}>{printer.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Mapping</label>
                <select
                  value={newDeployment.roleMapping}
                  onChange={(e) => setNewDeployment({...newDeployment, roleMapping: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base"
                >
                  <option value="Donation Desk">Donation Desk</option>
                  <option value="Chit Desk">Chit Desk</option>
                  <option value="Full Setup">Full Setup</option>
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                <button onClick={() => setShowModal(false)} className="w-full sm:w-auto border border-gray-300 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1">
                  Cancel
                </button>
                <button onClick={handleRegisterDeployment} className="w-full sm:w-auto bg-indigo-950 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-indigo-900 text-sm sm:text-base order-1 sm:order-2">
                  Register Deployment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Deployment Modal */}
      {selectedDeployment && (
        <ManageDeploymentModal 
          deployment={selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
          onUpdateStatus={handleUpdateStatus}
          hardwareInventory={hardwareInventory}
          updateHardwareStatus={updateHardwareStatus}
        />
      )}
    </>
  );
}