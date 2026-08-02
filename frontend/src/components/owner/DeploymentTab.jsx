import { useState, useEffect } from 'react';
import { Plus, Settings, MapPin, Phone, User, Loader2 } from 'lucide-react';
import { useDeployment } from '../../contexts/DeploymentContext';
import { useEvent } from '../../contexts/EventContext';
import { API_CONFIG, fetchWithAuth } from '../../config/api.js';

export default function DeploymentTab({ deployments, setDeployments }) {
  const { setActiveDeployment } = useDeployment();
  const { events } = useEvent();
  const [showModal, setShowModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hardware, setHardware] = useState([]);
  const [showHardwareModal, setShowHardwareModal] = useState(false);

  // New deployment form state
  const [newDeployment, setNewDeployment] = useState({
    event: '',
    venue: '',
    client: '',
    phone: '',
    start_date: '',
    end_date: '',
  });

  // Fetch deployments from backend
  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DEPLOYMENTS);
      if (response.ok) {
        const data = await response.json();
        setDeployments(data.results || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-accent-50 text-accent-700 border border-amber-200',
      'attended': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'rejected': 'bg-red-50 text-red-700 border border-red-200',
      'Pending': 'bg-accent-50 text-accent-700 border border-amber-200',
      'Active': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Attended': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      'Rejected': 'bg-red-50 text-red-700 border border-red-200',
    };
    return styles[status] || 'bg-brand-100 text-brand-600 border border-brand-200';
  };

  const handleManageDeployment = (deployment) => {
    setSelectedDeployment(deployment);
    setActiveDeployment(deployment);
  };

  const handleRegisterDeployment = async () => {
    if (!newDeployment.event || !newDeployment.venue || !newDeployment.client || !newDeployment.phone || !newDeployment.start_date || !newDeployment.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const deploymentData = {
        event: newDeployment.event,
        venue: newDeployment.venue,
        client: newDeployment.client,
        phone: newDeployment.phone,
        start_date: newDeployment.start_date,
        end_date: newDeployment.end_date,
        status: 'pending'
      };

      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DEPLOYMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentData),
      });

      if (response.ok) {
        const data = await response.json();
        setDeployments(prev => [...prev, data]);
        setShowModal(false);

        setNewDeployment({
          event: '',
          venue: '',
          client: '',
          phone: '',
          start_date: '',
          end_date: '',
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create deployment:', errorData);
        alert('Failed to create deployment: ' + (errorData.error || JSON.stringify(errorData)));
      }
    } catch (err) {
      console.error('Failed to register deployment:', err);
      alert('Failed to register deployment');
    } finally {
      setLoading(false);
    }
  };

  // Responsive table component for deployments
  const DeploymentCard = ({ deployment }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{deployment.title || deployment.event_title || 'No Event'}</h4>
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
          <p className="text-gray-500 font-semibold">Dates</p>
          <p className="text-gray-900 font-medium">
            {deployment.start_date} - {deployment.end_date}
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Hardware</p>
          <p className="text-gray-900 font-medium">
            {deployment.hardware_set?.length || 0} devices
          </p>
        </div>
        <div>
          <p className="text-gray-500 font-semibold">Session</p>
          <p className="text-gray-900 font-medium">
            {deployment.session_timer?.is_active ? 'Active' : 'Inactive'}
          </p>
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

  return (
    <>
      {/* Page Title */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Deployments</h2>
        <p className="text-sm md:text-base text-gray-500">Manage event deployments</p>
      </div>

      {/* Action Bar */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-950 hover:bg-indigo-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} /> Register New Deployment
        </button>
      </div>

      {/* Active Deployments */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Active Deployments</h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        ) : deployments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No deployments found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '800px', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Event & Venue</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Dates</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Hardware</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Session</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment) => (
                  <tr key={deployment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900 text-sm">{deployment.title || deployment.event_title || 'No Event'}</p>
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
                        {deployment.phone ? deployment.phone.replace('+233 ', '0').replace('+233', '0') : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-xs text-gray-700">
                        {deployment.start_date} - {deployment.end_date}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-xs text-gray-700">
                        {deployment.hardware_set?.length || 0} devices
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${deployment.session_timer?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {deployment.session_timer?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Register New Deployment</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event</label>
                <select
                  value={newDeployment.event}
                  onChange={(e) => setNewDeployment({...newDeployment, event: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.family_name} – {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue Location</label>
                <input
                  type="text"
                  value={newDeployment.venue}
                  onChange={(e) => setNewDeployment({...newDeployment, venue: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Enter venue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
                  <input
                    type="text"
                    value={newDeployment.client}
                    onChange={(e) => setNewDeployment({...newDeployment, client: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={newDeployment.phone}
                    onChange={(e) => setNewDeployment({...newDeployment, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                    placeholder="+233..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={newDeployment.start_date}
                    onChange={(e) => setNewDeployment({...newDeployment, start_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={newDeployment.end_date}
                    onChange={(e) => setNewDeployment({...newDeployment, end_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm">
                  Cancel
                </button>
                <button onClick={handleRegisterDeployment} className="bg-indigo-950 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-900 text-sm flex items-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Register Deployment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}