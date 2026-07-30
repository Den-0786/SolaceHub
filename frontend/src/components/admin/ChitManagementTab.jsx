import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Utensils, Calendar, Users, FileText, TrendingUp, Loader2, Ticket } from 'lucide-react';
import { useOwnerSettings } from '../../hooks/useOwnerSettings.js';
import { API_CONFIG, fetchWithAuth } from '../../config/api.js';

export default function ChitManagementTab() {
  const { settings } = useOwnerSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [chitData, setChitData] = useState([]);
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
    fetchChitData();
  }, []);

  const fetchChitData = async () => {
    setLoading(true);
    setShowEmptyState(false);
    
    // Set a timeout to show empty state after 5 seconds
    const timeoutId = setTimeout(() => {
      if (loading) {
        setShowEmptyState(true);
      }
    }, 5000);
    
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.CHITS);
      if (response.ok) {
        const data = await response.json();
        setChitData(data.results || data);
      } else {
        console.error('Failed to fetch chit data:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch chit data:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (loading && !showEmptyState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-950" size={32} />
          <p className="text-sm text-gray-500">Loading chit data...</p>
        </div>
      </div>
    );
  }

  if (showEmptyState || chitData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <Ticket size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-base font-medium text-gray-900 mb-2">No chit data yet</p>
          <p className="text-sm text-gray-500">Chit entries will appear here once they are issued</p>
        </div>
      </div>
    );
  }

  // Calculate analytics - group by calendar date dynamically
  const analytics = useMemo(() => {
    const totalChits = chitData.length;
    const totalGuests = chitData.reduce((sum, chit) => sum + chit.guests, 0);

    // Group by calendar date
    const groupedByDate = chitData.reduce((acc, chit) => {
      const date = chit.calendarDate;
      if (!acc[date]) {
        acc[date] = {
          chitsIssued: 0,
          guestsCatered: 0,
          dayNumber: chit.dayNumber,
          dateLabel: chit.date
        };
      }
      acc[date].chitsIssued += 1;
      acc[date].guestsCatered += chit.guests;
      return acc;
    }, {});

    // Convert to array and sort by day number
    const daySummaries = Object.values(groupedByDate)
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .slice(0, settings.durationDays || 3); // Limit to duration_days from settings

    return {
      totalChits,
      totalGuests,
      daySummaries
    };
  }, [chitData, settings.durationDays]);

  // Filter data based on search and day filter
  const filteredData = useMemo(() => {
    return chitData.filter(chit => {
      const matchesSearch =
        chit.representative.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chit.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDay =
        dayFilter === 'all' ||
        (dayFilter === 'day1' && chit.dayNumber === 1) ||
        (dayFilter === 'day2' && chit.dayNumber === 2) ||
        (dayFilter === `day${chit.dayNumber}` && chit.dayNumber === parseInt(dayFilter.replace('day', '')));

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
    console.log('Exporting chit data...');
  };

  const getVoucherTypeColor = (type) => {
    switch (type) {
      case 'VIP Package':
        return 'bg-purple-100 text-purple-800';
      case 'Food & Soft Drink':
        return 'bg-amber-100 text-amber-800';
      case 'Food Only':
        return 'bg-emerald-100 text-emerald-800';
      case 'Beverage / Water Only':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Chit Management</h1>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>Comprehensive ledger of all refreshment vouchers issued across event days.</p>
      </div>

      {/* Search Bar & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by representative name, security code, or voucher type..."
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
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(to bottom right, #f59e0b, #d97706)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={20} style={{ color: 'white' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', color: '#fbbf24' }}>
                  <TrendingUp size={12} />
                  <span>Grand Total</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Refreshment Vouchers</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>{analytics.totalChits} Vouchers</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>{analytics.totalGuests} Cumulative Guests</p>
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
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{day.chitsIssued} Chits</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>{day.guestsCatered} Guests Catered For</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Chit Ledger Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Detailed Chit Ledger</h2>
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Security Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Representative Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Guest Count</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Voucher Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Event Day</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Time & Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Issued By</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((chit) => (
                  <tr key={chit.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#020617' }}>{chit.id}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{chit.representative}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{chit.guests} Guests</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: getVoucherTypeColor(chit.type).includes('purple') ? '#f3e8ff' : getVoucherTypeColor(chit.type).includes('amber') ? '#fef3c7' : getVoucherTypeColor(chit.type).includes('emerald') ? '#d1fae5' : '#dbeafe', color: getVoucherTypeColor(chit.type).includes('purple') ? '#6b21a8' : getVoucherTypeColor(chit.type).includes('amber') ? '#92400e' : getVoucherTypeColor(chit.type).includes('emerald') ? '#065f46' : '#1e40af' }}>
                        {chit.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: chit.dayNumber === 1 ? '#fef3c7' : chit.dayNumber === 2 ? '#d1fae5' : '#dbeafe', color: chit.dayNumber === 1 ? '#92400e' : chit.dayNumber === 2 ? '#065f46' : '#1e40af' }}>
                        Day {chit.dayNumber}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{chit.time} | {chit.date}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{chit.issuedBy}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px auto', color: '#d1d5db' }} />
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>No chit records found matching your search</p>
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
