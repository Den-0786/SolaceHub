/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Wallet, Calendar, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useOwnerSettings } from '../../hooks/useOwnerSettings.js';
import { API_CONFIG, fetchWithAuth } from '../../config/api.js';

export default function RegistriesTab() {
  const { settings } = useOwnerSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [donorData, setDonorData] = useState([]);
  const entriesPerPage = 15;

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
  }, []);

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

  if (!loading && donorData.length === 0) {
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
          dayNumber: donor.event_day,
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
  }, [donorData, settings.durationDays]);

  // Filter data based on search and day filter
  const filteredData = useMemo(() => {
    return donorData.filter(donor => {
      const matchesSearch =
        donor.donor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.phone_number?.includes(searchQuery) ||
        donor.receipt_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDay =
        dayFilter === 'all' ||
        (dayFilter === 'day1' && donor.event_day === 1) ||
        (dayFilter === 'day2' && donor.event_day === 2) ||
        (dayFilter === `day${donor.event_day}` && donor.event_day === parseInt(dayFilter.replace('day', '')));

      return matchesSearch && matchesDay;
    });
  }, [searchQuery, dayFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredData.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredData, currentPage]);

  const handleExport = () => {
    // Placeholder for export functionality
    console.log('Exporting data...');
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#020617', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto' }}
          >
            <Download size={16} /> Export PDF / Excel
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Receipt / Donor ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Donor Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Phone Number</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Amount (GH₵)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Event Day</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Time & Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((donor) => (
                  <tr key={donor.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
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
                        Day {donor.event_day}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.time} | {new Date(donor.date).toLocaleDateString()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.logged_by_name || 'System'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center' }}>
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
    </div>
  );
}