import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Wallet, Calendar, FileText, TrendingUp, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useOwnerSettings } from '../../hooks/useOwnerSettings.js';
import { API_CONFIG, fetchWithAuth } from '../../config/api.js';

const formatAmount = (value) =>
  `GH₵ ${parseFloat(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const firstError = (detail) => {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  for (const value of Object.values(detail)) {
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (typeof value === 'string') return value;
  }
  return '';
};

const computeEventDay = (recordDate, startDate) => {
  if (!startDate) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const rec = new Date(recordDate);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const recUtc = Date.UTC(rec.getFullYear(), rec.getMonth(), rec.getDate());
  return Math.max(1, Math.floor((recUtc - startUtc) / dayMs) + 1);
};

export default function RegistriesTab() {
  const { settings } = useOwnerSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setShowEmptyState] = useState(false);
  const [donorData, setDonorData] = useState([]);
  const [deploymentStartDate, setDeploymentStartDate] = useState(null);
  const [exporting, setExporting] = useState(false);
  const entriesPerPage = 15;

  const [editingDonor, setEditingDonor] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editMethod, setEditMethod] = useState('Cash');
  const [editDate, setEditDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchDonorData();
    fetchDeploymentStartDate();
  }, []);

  const fetchDeploymentStartDate = async () => {
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DEPLOYMENTS);
      if (response.ok) {
        const data = await response.json();
        const list = data.results || data || [];
        if (list.length > 0) {
          // Day numbering counts from the earliest deployment start, so pick it
          // deterministically rather than relying on API ordering.
          const earliest = [...list]
            .filter((d) => d.start_date)
            .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
          setDeploymentStartDate(earliest?.start_date || list[0].start_date);
        }
      }
    } catch (err) {
      console.error('Failed to fetch deployment start date:', err);
    }
  };

  const fetchDonorData = async () => {
    setLoading(true);
    setShowEmptyState(false);

    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.DONORS);
      if (response.ok) {
        const data = await response.json();
        setDonorData(data.results || data || []);
      } else {
        console.error('Failed to fetch donor data:', response.status);
        setDonorData([]);
      }
    } catch (err) {
      console.error('Failed to fetch donor data:', err);
      setDonorData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics - group by calendar date dynamically
  const analytics = useMemo(() => {
    const totalDonations = donorData.reduce((sum, donor) => sum + parseFloat(donor.amount || 0), 0);
    const totalDonors = donorData.length;

    // Group by calendar date
    const groupedByDate = donorData.reduce((acc, donor) => {
      const date = donor.date;
      if (!acc[date]) {
        acc[date] = {
          total: 0,
          donors: 0,
          dayNumber: computeEventDay(donor.date, deploymentStartDate) ?? donor.event_day,
          dateLabel: new Date(donor.date).toLocaleDateString()
        };
      }
      acc[date].total += parseFloat(donor.amount || 0);
      acc[date].donors += 1;
      return acc;
    }, {});

    // Convert to array and sort by day number
    const daySummaries = Object.values(groupedByDate)
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .slice(0, settings.durationDays || 3); // Limit to duration_days from settings

    return {
      totalDonations,
      totalDonors,
      daySummaries
    };
  }, [donorData, settings.durationDays, deploymentStartDate]);

  // Filter data based on search and day filter
  const filteredData = useMemo(() => {
    return donorData.filter(donor => {
      const matchesSearch =
        donor.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.phone_number?.includes(searchQuery) ||
        donor.receipt_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const donorDay = computeEventDay(donor.date, deploymentStartDate) ?? donor.event_day;

      const matchesDay =
        dayFilter === 'all' ||
        (dayFilter === 'day1' && donorDay === 1) ||
        (dayFilter === 'day2' && donorDay === 2) ||
        (dayFilter === `day${donorDay}` && donorDay === parseInt(dayFilter.replace('day', '')));

      return matchesSearch && matchesDay;
    });
  }, [donorData, searchQuery, dayFilter, deploymentStartDate]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredData.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredData, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-950" size={32} />
          <p className="text-sm text-gray-500">Loading registry data...</p>
        </div>
      </div>
    );
  }

  if (donorData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-base font-medium text-gray-900 mb-2">No registry data yet</p>
          <p className="text-sm text-gray-500">Donation entries will appear here once they are logged</p>
        </div>
      </div>
    );
  }

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      // Reuse the on-screen day filter so what the family sees is exactly
      // what lands in the file. "All Active Days" sends no scope.
      const scope =
        dayFilter && dayFilter !== 'all'
          ? `?day=${dayFilter.replace('day', '')}`
          : '';
      const suffix = dayFilter && dayFilter !== 'all' ? `-day-${dayFilter.replace('day', '')}` : '';
      const response = await fetchWithAuth(
        `${API_CONFIG.ENDPOINTS.REPORTS}export/donor-list/${scope}`
      );
      if (response.ok) {
        const blob = await response.blob();
        triggerDownload(
          blob,
          `solacehub-donor-list${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`
        );
      } else {
        console.error('Export failed:', response.status);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const scope =
        dayFilter && dayFilter !== 'all'
          ? `?day=${dayFilter.replace('day', '')}`
          : '';
      const suffix = dayFilter && dayFilter !== 'all' ? `-day-${dayFilter.replace('day', '')}` : '';
      const response = await fetchWithAuth(
        `${API_CONFIG.ENDPOINTS.REPORTS}export/donor-list-pdf/${scope}`
      );
      if (response.ok) {
        const blob = await response.blob();
        triggerDownload(
          blob,
          `solacehub-donor-list${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`
        );
      } else {
        console.error('PDF export failed:', response.status);
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const openEdit = (donor) => {
    setEditingDonor(donor);
    setEditName(donor.donor_name || '');
    setEditPhone(donor.phone_number || '');
    setEditAmount(donor.amount != null ? String(donor.amount) : '');
    setEditMethod(donor.method || 'Cash');
    setEditDate(donor.date || '');
    setEditError('');
  };

  const handleUpdate = async () => {
    setEditError('');
    const parsedAmount = parseFloat(editAmount);
    if (!editName.trim()) {
      setEditError('Please enter a donor name.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setEditError('Please enter a valid amount greater than zero.');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.DONORS}${editingDonor.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          donor_name: editName.trim(),
          phone_number: editPhone.trim(),
          amount: parsedAmount,
          method: editMethod,
          ...(editDate ? { date: editDate } : {}),
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setDonorData((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
        setEditingDonor(null);
      } else {
        const detail = await response.json().catch(() => ({}));
        setEditError(firstError(detail) || 'Failed to update entry. Please try again.');
      }
    } catch (err) {
      console.error('Failed to update donor:', err);
      setEditError('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError('');
    setDeleting(true);
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.DONORS}${pendingDelete.id}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Deleting an entry refills the numbering, so the numbers on every
        // later row change. Refetch instead of filtering locally.
        await fetchDonorData();
        setPendingDelete(null);
      } else {
        setDeleteError('Failed to delete entry. Please try again.');
        console.error('Failed to delete donor:', response.status);
      }
    } catch (err) {
      console.error('Failed to delete donor:', err);
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Donation Registries</h1>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>Comprehensive ledger of all financial contributions across event days.</p>
      </div>

      {/* Search Bar & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by donor name, phone, or receipt ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb' }}
            />
          </div>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: isMobile ? '100%' : 'auto', minWidth: isMobile ? '100%' : '150px' }}
          >
            <option value="all">All Active Days</option>
            {analytics.daySummaries.map((day) => (
              <option key={`day${day.dayNumber}`} value={`day${day.dayNumber}`}>
                Day {day.dayNumber} Only
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#020617', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto', opacity: exporting ? 0.7 : 1 }}
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {exporting ? 'Exporting...' : dayFilter === 'all' ? 'Export Excel' : `Export Day ${dayFilter.replace('day', '')}`}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            title="Download this selection as a printable PDF"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'white', color: '#020617', borderRadius: '12px', fontSize: '14px', fontWeight: '500', border: '1px solid #e5e7eb', cursor: exporting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto', opacity: exporting ? 0.7 : 1 }}
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} {exporting ? 'Preparing...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Analytics Cards - Dynamic Day System with Horizontal Scroll */}
      <div style={{ position: 'relative' }}>
        <style>
          {`@media (min-width: 640px) {
            .cards-scroll-container {
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              justify-content: center !important;
            }
          }
          @media (max-width: 639px) {
            .cards-scroll-container {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
              max-width: 100vw !important;
              width: 100% !important;
              margin-left: -16px !important;
              margin-right: -16px !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
              justify-content: flex-start !important;
            }
            .mobile-card {
              width: 240px !important;
            }
          }`}
        </style>
        
        <div className="cards-scroll-container" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content', justifyContent: isMobile ? 'flex-start' : 'center' }}>
            {/* Grand Total Card (Always Visible) */}
            <div className="mobile-card" style={{ background: 'linear-gradient(to bottom right, #1e293b, #0f172a)', borderRadius: '16px', padding: '16px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '280px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #10b981, #059669)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={20} style={{ color: 'white' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', color: '#34d399' }}>
                  <TrendingUp size={12} />
                  <span>Grand Total</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Grand Total</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>GH₵ {analytics.totalDonations.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>{analytics.totalDonors} Total Donors</p>
            </div>

            {/* Dynamic Day Summary Cards */}
            {analytics.daySummaries.map((day) => (
              <div key={day.dayNumber} className="mobile-card" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', width: '280px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #6366f1, #4f46e5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} style={{ color: 'white' }} />
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                    Day {day.dayNumber}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Day {day.dayNumber} - {day.dateLabel}</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>GH₵ {day.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>{day.donors} Donors logged</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Donor Registry Table - Fully Responsive with Horizontal Scroll */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Detailed Donor Registry</h2>
        </div>
        
        {/* Table with horizontal scroll */}
        <style>
          {`@media (min-width: 640px) {
            .table-scroll-container {
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
          }
          @media (max-width: 639px) {
            .table-scroll-container {
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
        <div className="table-scroll-container" style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>#</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Receipt / Donor ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Donor Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Phone Number</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Amount (GH₵)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Event Day</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Time & Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Logged By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((donor) => (
                  <tr key={donor.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{donor.entry_number ?? '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#020617' }}>{donor.receipt_id}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{donor.donor_name}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.phone_number}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>GH₵ {parseFloat(donor.amount || 0).toFixed(2)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: donor.event_day === 1 ? '#fef3c7' : donor.event_day === 2 ? '#d1fae5' : '#dbeafe', color: donor.event_day === 1 ? '#92400e' : donor.event_day === 2 ? '#065f46' : '#1e40af' }}>
                        Day {computeEventDay(donor.date, deploymentStartDate) ?? donor.event_day}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.time} | {new Date(donor.date).toLocaleDateString()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.logged_by_name || 'System'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(donor)}
                          title="Edit entry"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid #dbeafe', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', cursor: 'pointer' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteError(''); setPendingDelete(donor); }}
                          title="Delete entry"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <FileText size={48} style={{ margin: '0 auto', color: '#d1d5db', marginBottom: '16px' }} />
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>No donor records found matching your search</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
              Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, filteredData.length)} of {filteredData.length} entries
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', backgroundColor: currentPage === page ? '#020617' : 'white', color: currentPage === page ? 'white' : '#374151', border: currentPage === page ? 'none' : '1px solid #e5e7eb' }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Entry Modal */}
      {editingDonor && (
        <div
          onClick={() => !updating && setEditingDonor(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Edit Entry</h2>
              <button
                onClick={() => !updating && setEditingDonor(null)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: 'none', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Receipt <strong style={{ color: '#111827' }}>{editingDonor.receipt_id}</strong> stays the same so printed receipts still match the ledger.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Donor Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Amount (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Method</label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value)}
                    style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Momo">Momo</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Date recorded</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Change this only if the entry was logged on the wrong day. It moves the money between day cards.</span>
              </div>
              {editError && (
                <p style={{ fontSize: '13px', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>
                  {editError}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <button
                onClick={() => setEditingDonor(null)}
                disabled={updating}
                style={{ padding: '10px 18px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: updating ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 18px', border: 'none', borderRadius: '12px', backgroundColor: '#020617', color: 'white', fontSize: '14px', fontWeight: '500', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.7 : 1 }}
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : null} {updating ? 'Updating...' : 'Update Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          onClick={() => !deleting && setPendingDelete(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Delete Entry?</h2>
              <button
                onClick={() => !deleting && setPendingDelete(null)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: 'none', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
                Are you sure you want to delete{' '}
                <strong style={{ color: '#111827' }}>{pendingDelete.donor_name}</strong> ({formatAmount(pendingDelete.amount)})? This removes it from every total and from the printed audit.
              </p>
              {deleteError && (
                <p style={{ fontSize: '13px', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', margin: '12px 0 0 0' }}>
                  {deleteError}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                style={{ padding: '10px 18px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 18px', border: 'none', borderRadius: '12px', backgroundColor: '#dc2626', color: 'white', fontSize: '14px', fontWeight: '500', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
