import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { API_CONFIG, getAuthHeaders } from '../../config/api.js';
import { useToast } from '../../hooks/useToast.js';

function TenantManagement() {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    hired_start_date: '',
    hired_duration_days: 30,
    family_head_username: '',
    family_head_password: '',
    family_head_fallback_username: '',
    family_head_fallback_password: '',
    chit_fallback_username: '',
    chit_fallback_password: '',
    donation_fallback_username: '',
    donation_fallback_password: '',
  });

  const fetchTenants = async () => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.TENANTS, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const expirationDate = new Date(tenantForm.hired_start_date);
      expirationDate.setDate(expirationDate.getDate() + parseInt(tenantForm.hired_duration_days));

      const response = await fetch(API_CONFIG.ENDPOINTS.TENANTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: tenantForm.name,
          hired_start_date: tenantForm.hired_start_date,
          hired_duration_days: tenantForm.hired_duration_days,
          expiration_date: expirationDate.toISOString(),
        }),
      });

      if (response.ok) {
        const tenant = await response.json();
        addToast('Tenant created successfully', 'success');
        
        // Create tenant credentials
        await createTenantCredentials(tenant.id);
        
        setShowTenantForm(false);
        setTenantForm({
          name: '',
          hired_start_date: '',
          hired_duration_days: 30,
          family_head_username: '',
          family_head_password: '',
          family_head_fallback_username: '',
          family_head_fallback_password: '',
          chit_fallback_username: '',
          chit_fallback_password: '',
          donation_fallback_username: '',
          donation_fallback_password: '',
        });
        fetchTenants();
      } else {
        const data = await response.json();
        addToast(data.error || 'Failed to create tenant', 'error');
      }
    } catch (err) {
      addToast('Connection error', 'error');
    }
  };

  const createTenantCredentials = async (tenantId) => {
    const credentials = [
      {
        tenant: tenantId,
        credential_type: 'family_dashboard',
        username: tenantForm.family_head_username,
        password_hash: tenantForm.family_head_password,
        fallback_username: tenantForm.family_head_fallback_username,
        fallback_password_hash: tenantForm.family_head_fallback_password,
      },
      {
        tenant: tenantId,
        credential_type: 'chit_console',
        username: tenantForm.chit_fallback_username,
        password_hash: tenantForm.chit_fallback_password,
        fallback_username: tenantForm.chit_fallback_username,
        fallback_password_hash: tenantForm.chit_fallback_password,
      },
      {
        tenant: tenantId,
        credential_type: 'donation_portal',
        username: tenantForm.donation_fallback_username,
        password_hash: tenantForm.donation_fallback_password,
        fallback_username: tenantForm.donation_fallback_username,
        fallback_password_hash: tenantForm.donation_fallback_password,
      },
    ];

    for (const cred of credentials) {
      await fetch(`${API_CONFIG.ENDPOINTS.TENANTS}${tenantId}/credentials/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cred),
      });
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-indigo-950">Tenant Management</h2>
          <p className="text-sm text-gray-500">Manage family tenants and subscription credentials</p>
        </div>
        <button
          onClick={() => setShowTenantForm(true)}
          className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} /> Add Tenant
        </button>
      </div>

      {showTenantForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Tenant</h3>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  placeholder="Family name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hired Start Date</label>
                <input
                  type="datetime-local"
                  required
                  value={tenantForm.hired_start_date}
                  onChange={(e) => setTenantForm({...tenantForm, hired_start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tenantForm.hired_duration_days}
                  onChange={(e) => setTenantForm({...tenantForm, hired_duration_days: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Family Head Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.family_head_username}
                    onChange={(e) => setTenantForm({...tenantForm, family_head_username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={tenantForm.family_head_password}
                    onChange={(e) => setTenantForm({...tenantForm, family_head_password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fallback Username</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.family_head_fallback_username}
                    onChange={(e) => setTenantForm({...tenantForm, family_head_fallback_username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fallback Password</label>
                  <input
                    type="password"
                    required
                    value={tenantForm.family_head_fallback_password}
                    onChange={(e) => setTenantForm({...tenantForm, family_head_fallback_password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Fallback Credentials (Chit & Donation)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Chit Fallback Username</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.chit_fallback_username}
                    onChange={(e) => setTenantForm({...tenantForm, chit_fallback_username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Chit Fallback Password</label>
                  <input
                    type="password"
                    required
                    value={tenantForm.chit_fallback_password}
                    onChange={(e) => setTenantForm({...tenantForm, chit_fallback_password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Donation Fallback Username</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.donation_fallback_username}
                    onChange={(e) => setTenantForm({...tenantForm, donation_fallback_username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Donation Fallback Password</label>
                  <input
                    type="password"
                    required
                    value={tenantForm.donation_fallback_password}
                    onChange={(e) => setTenantForm({...tenantForm, donation_fallback_password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowTenantForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium"
              >
                Create Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tenant Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Expiration</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{tenant.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(tenant.hired_start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{tenant.hired_duration_days} days</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(tenant.expiration_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                  No tenants found. Click "Add Tenant" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TenantManagement;
