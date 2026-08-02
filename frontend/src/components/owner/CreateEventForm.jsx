import { useState } from 'react';
import { Calendar, Users, Type, Hash, Plus } from 'lucide-react';
import { useToast } from '../../hooks/useToast.js';
import { fetchWithAuth, API_CONFIG } from '../../config/api.js';

export default function CreateEventForm({ onCreated }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [date, setDate] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !familyName.trim() || !date) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating event...');
      const eventData = {
        title: title.trim(),
        family_name: familyName.trim(),
        date,
        access_code: accessCode.trim() || null,
        is_active: true,
      };
      console.log('Event data:', eventData);

      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.EVENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        addToast('Event created successfully', 'success');
        setTitle('');
        setFamilyName('');
        setDate('');
        setAccessCode('');
        if (onCreated) onCreated(data);
      } else {
        console.error('Create event failed:', data);
        addToast(data.error || data.access_code?.[0] || data.detail || `Failed to create event (${response.status})`, 'error');
      }
    } catch (err) {
      console.error('Create event error:', err);
      addToast('Network error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Plus size={20} className="text-indigo-600" />
        Create New Event
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Event Title</label>
          <div className="relative">
            <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Funeral Rites"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Family Name</label>
          <div className="relative">
            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. Boateng"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Service Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Access Code <span className="text-gray-400">(Optional - Auto-generated if empty)</span></label>
          <div className="relative">
            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. BOATENG001 (leave empty for auto-generation)"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950"
            />
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-950 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-900 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
