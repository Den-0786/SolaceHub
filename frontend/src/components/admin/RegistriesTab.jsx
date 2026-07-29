/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Wallet, Calendar,FileText, TrendingUp } from 'lucide-react';
import { useOwnerSettings } from '../../hooks/useOwnerSettings.js';

export default function RegistriesTab() {
  const { settings } = useOwnerSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const entriesPerPage = 15;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock data for demonstration with actual calendar dates
  const donorData = [
    { id: '#RC-8821', name: 'Daniel Boateng', phone: '+233 24 123 4567', amount: 2500.00, calendarDate: '2024-01-24', dayNumber: 1, time: '14:22 PM', date: 'Jan 24', loggedBy: 'Kwame Akoto' },
    { id: '#RC-8820', name: 'Ama Serwaa', phone: '+233 24 234 5678', amount: 1200.00, calendarDate: '2024-01-24', dayNumber: 1, time: '14:15 PM', date: 'Jan 24', loggedBy: 'Sister Abena' },
    { id: '#RC-8819', name: 'Kwame Asante', phone: '+233 24 345 6789', amount: 500.00, calendarDate: '2024-01-25', dayNumber: 2, time: '14:05 PM', date: 'Jan 25', loggedBy: 'Kwame Akoto' },
    { id: '#RC-8818', name: 'Efua Dufie', phone: '+233 24 456 7890', amount: 3000.00, calendarDate: '2024-01-24', dayNumber: 1, time: '13:58 PM', date: 'Jan 24', loggedBy: 'Nana Yaw' },
    { id: '#RC-8817', name: 'Kofi Mensah', phone: '+233 24 567 8901', amount: 750.00, calendarDate: '2024-01-25', dayNumber: 2, time: '13:45 PM', date: 'Jan 25', loggedBy: 'Kwame Akoto' },
    { id: '#RC-8816', name: 'Yaa Asantewaa', phone: '+233 24 678 9012', amount: 1800.00, calendarDate: '2024-01-24', dayNumber: 1, time: '13:30 PM', date: 'Jan 24', loggedBy: 'Sister Abena' },
    { id: '#RC-8815', name: 'Nana Kwame', phone: '+233 24 789 0123', amount: 1200.00, calendarDate: '2024-01-25', dayNumber: 2, time: '13:20 PM', date: 'Jan 25', loggedBy: 'Nana Yaw' },
    { id: '#RC-8814', name: 'Akosua Mensah', phone: '+233 24 890 1234', amount: 950.00, calendarDate: '2024-01-24', dayNumber: 1, time: '13:10 PM', date: 'Jan 24', loggedBy: 'Kwame Akoto' },
    { id: '#RC-8813', name: 'Kofi Boateng', phone: '+233 24 901 2345', amount: 2100.00, calendarDate: '2024-01-25', dayNumber: 2, time: '13:00 PM', date: 'Jan 25', loggedBy: 'Sister Abena' },
    { id: '#RC-8812', name: 'Efua Danso', phone: '+233 24 012 3456', amount: 1500.00, calendarDate: '2024-01-24', dayNumber: 1, time: '12:50 PM', date: 'Jan 24', loggedBy: 'Nana Yaw' },
    { id: '#RC-8811', name: 'Kwame Duah', phone: '+233 24 123 4568', amount: 800.00, calendarDate: '2024-01-25', dayNumber: 2, time: '12:40 PM', date: 'Jan 25', loggedBy: 'Kwame Akoto' },
    { id: '#RC-8810', name: 'Yaa Manu', phone: '+233 24 234 5679', amount: 1750.00, calendarDate: '2024-01-24', dayNumber: 1, time: '12:30 PM', date: 'Jan 24', loggedBy: 'Sister Abena' },
    { id: '#RC-8809', name: 'Nana Osei', phone: '+233 24 345 6780', amount: 2200.00, calendarDate: '2024-01-25', dayNumber: 2, time: '12:20 PM', date: 'Jan 25', loggedBy: 'Nana Yaw' },
    { id: '#RC-8808', name: 'Akosua Ofori', phone: '+233 24 456 7891', amount: 1300.00, calendarDate: '2024-01-24', dayNumber: 1, time: '12:10 PM', date: 'Jan 24', loggedBy: 'Kwame Akoto' },
    { id: '#RC-8807', name: 'Kofi Osei', phone: '+233 24 567 8902', amount: 900.00, calendarDate: '2024-01-25', dayNumber: 2, time: '12:00 PM', date: 'Jan 25', loggedBy: 'Sister Abena' },
    { id: '#RC-8806', name: 'Yaa Amoako', phone: '+233 24 678 9013', amount: 1600.00, calendarDate: '2024-01-24', dayNumber: 1, time: '11:50 AM', date: 'Jan 24', loggedBy: 'Nana Yaw' },
    { id: '#RC-8805', name: 'Nana Mensah', phone: '+233 24 789 0124', amount: 1950.00, calendarDate: '2024-01-25', dayNumber: 2, time: '11:40 AM', date: 'Jan 25', loggedBy: 'Kwame Akoto' },
  ];

  // Calculate analytics - group by calendar date dynamically
  const analytics = useMemo(() => {
    const totalDonations = donorData.reduce((sum, donor) => sum + donor.amount, 0);
    const totalDonors = donorData.length;

    // Group by calendar date
    const groupedByDate = donorData.reduce((acc, donor) => {
      const date = donor.calendarDate;
      if (!acc[date]) {
        acc[date] = {
          total: 0,
          donors: 0,
          dayNumber: donor.dayNumber,
          dateLabel: donor.date
        };
      }
      acc[date].total += donor.amount;
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
        donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.phone.includes(searchQuery) ||
        donor.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDay =
        dayFilter === 'all' ||
        (dayFilter === 'day1' && donor.dayNumber === 1) ||
        (dayFilter === 'day2' && donor.dayNumber === 2) ||
        (dayFilter === `day${donor.dayNumber}` && donor.dayNumber === parseInt(dayFilter.replace('day', '')));

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
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#020617' }}>{donor.id}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{donor.name}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.phone}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>GH₵ {donor.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: donor.dayNumber === 1 ? '#fef3c7' : donor.dayNumber === 2 ? '#d1fae5' : '#dbeafe', color: donor.dayNumber === 1 ? '#92400e' : donor.dayNumber === 2 ? '#065f46' : '#1e40af' }}>
                        Day {donor.dayNumber}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.time} | {donor.date}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{donor.loggedBy}</span>
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