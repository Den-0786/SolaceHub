import { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, Users, Utensils, BarChart, Award, Calendar, DollarSign, Info, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { API_CONFIG, fetchWithAuth } from '../../config/api.js';

const VOUCHER_TYPE_KEYS = [
  'full_package',
  'water_only',
  'drink_only',
  'drinks_water',
  'food_water',
  'food_drinks',
];

const VOUCHER_TYPE_LABELS = {
  full_package: 'Full Package',
  water_only: 'Water Only',
  drink_only: 'Drink Only',
  drinks_water: 'Drinks & Water',
  food_water: 'Food & Water',
  food_drinks: 'Food & Drinks',
};

export default function ReportsTab() {
  const [activeModule, setActiveModule] = useState('financial');
  const [expandedSections, setExpandedSections] = useState({});
  const [modalSection, setModalSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [exporting, setExporting] = useState(null);
  
  // Data state
  const [summaryData, setSummaryData] = useState(null);
  const [financialAuditData, setFinancialAuditData] = useState(null);
  const [topDonors, setTopDonors] = useState([]);
  const [refreshmentAuditData, setRefreshmentAuditData] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchReportData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setShowEmptyState(false);

    const timeoutId = setTimeout(() => {
      setShowEmptyState(true);
    }, 5000);
    
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.REPORTS}summary/`);
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data.summary);
        setFinancialAuditData(data.financialAudit);
        setTopDonors(data.topDonors);
        setRefreshmentAuditData(data.refreshmentAudit);
      } else {
        console.error('Failed to fetch report data:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setModalSection(section);
  };

  const closeModal = () => {
    setModalSection(null);
  };

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

  const handleRefresh = () => {
    fetchReportData();
  };

  const handleDownloadPDF = async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.REPORTS}export/pdf/`);
      if (response.ok) {
        const blob = await response.blob();
        triggerDownload(blob, `family-audit-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        console.error('PDF export failed:', response.status);
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting('csv');
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.REPORTS}export/csv/`);
      if (response.ok) {
        const blob = await response.blob();
        triggerDownload(blob, `solacehub-raw-data-${new Date().toISOString().slice(0, 10)}.csv`);
      } else {
        console.error('CSV export failed:', response.status);
      }
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  if (loading && !showEmptyState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-950" size={32} />
          <p className="text-sm text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <BarChart size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-base font-medium text-gray-900 mb-2">No report data yet</p>
          <p className="text-sm text-gray-500">Report data will appear here once activity is recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial & Operational Reports</h1>
          <p className="text-sm text-gray-500">Export official financial audit statements, donor books, and refreshment summaries for family review.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!!exporting}
            className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {exporting === 'pdf' ? 'Generating PDF...' : 'Download Complete Family Audit PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!!exporting}
            className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting === 'csv' ? 'Exporting...' : 'Export Raw Data (Excel/CSV)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg text-xs font-medium text-white">
              <TrendingUp size={12} />
              <span>+15%</span>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white mb-2">GH₵ {summaryData.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          <div className="flex gap-2 text-xs text-white/70">
            <span>Cash: GH₵ {summaryData.cashRevenue.toLocaleString('en-GH')}</span>
            <span>-</span>
            <span>MoMo: GH₵ {summaryData.momoRevenue.toLocaleString('en-GH')}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-indigo-600" />
            </div>
            <div className="flex items-center gap-1 bg-indigo-100 px-2 py-1 rounded-lg text-xs font-medium text-indigo-700">
              <TrendingUp size={12} />
              <span>+8%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Donors</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{summaryData.totalDonors}</p>
          <p className="text-xs text-gray-400">Recorded contributors</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Utensils size={24} className="text-amber-600" />
            </div>
            <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg text-xs font-medium text-amber-700">
              <BarChart size={12} />
              <span>88%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Refreshment Vouchers</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{summaryData.totalChitsIssued}</p>
          <p className="text-xs text-gray-400">of {summaryData.estimatedGuests} estimated guests</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award size={24} className="text-purple-600" />
            </div>
            <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-lg text-xs font-medium text-purple-700">
              <TrendingUp size={12} />
              <span>+12%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Average Donation</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">GH₵ {summaryData.averageDonation.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400">per donor</p>
        </div>
      </div>

      {/* Report Modules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <style>
            {`@media (min-width: 640px) {
              .buttons-scroll-container {
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
              }
            }
            @media (max-width: 639px) {
              .buttons-scroll-container {
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
          <div className="buttons-scroll-container" style={{ display: 'flex', gap: '8px', width: '100%', overflowX: 'auto' }}>
            <button
              onClick={() => setModalSection(modalSection === 'financial' ? null : 'financial')}
              className="py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: modalSection === 'financial' ? '#020617' : 'white', color: modalSection === 'financial' ? 'white' : '#374151', border: modalSection === 'financial' ? 'none' : '1px solid #e5e7eb', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <FileText size={16} className="inline mr-2" /> Financial Audit
            </button>
            <button
              onClick={() => setModalSection(modalSection === 'donors' ? null : 'donors')}
              className="py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: modalSection === 'donors' ? '#020617' : 'white', color: modalSection === 'donors' ? 'white' : '#374151', border: modalSection === 'donors' ? 'none' : '1px solid #e5e7eb', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Award size={16} className="inline mr-2" /> Top Donors
            </button>
            <button
              onClick={() => setModalSection(modalSection === 'refreshment' ? null : 'refreshment')}
              className="py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: modalSection === 'refreshment' ? '#020617' : 'white', color: modalSection === 'refreshment' ? 'white' : '#374151', border: modalSection === 'refreshment' ? 'none' : '1px solid #e5e7eb', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Utensils size={16} className="inline mr-2" /> Catering Audit
            </button>
          </div>
        </div>

        {modalSection === 'financial' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm" style={{ overflow: 'hidden' }}>
            <div className="p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Executive Financial Audit Statement</h2>
                <p className="text-sm text-gray-500">Official financial breakdown for family review</p>
              </div>
            </div>
              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-1">{financialAuditData.deceasedName}</h3>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <Calendar size={14} /> {financialAuditData.memorialDates}
                  </p>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Day-by-Day Financial Breakdown</h4>
                  <style>
                    {`@media (min-width: 640px) {
                      .financial-day-table-scroll {
                        overflow-x: visible !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                      }
                    }
                    @media (max-width: 639px) {
                      .financial-day-table-scroll {
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
                  <div className="financial-day-table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', fontSize: '14px' }}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Event Day</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Total (GH₵)</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Donors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialAuditData.dayBreakdown.map((day, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{day.day}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#4b5563' }}>{day.date}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>GH₵ {day.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#4b5563' }}>{day.donors}</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#e0e7ff', fontWeight: 'bold' }}>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#312e81' }}>Grand Total</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#4f46e5' }}>All Days</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#312e81' }}>GH₵ {summaryData.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#4f46e5' }}>{summaryData.totalDonors}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Desk Attendant Audit Log</h4>
                  <style>
                    {`@media (min-width: 640px) {
                      .financial-desk-table-scroll {
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                      }
                    }
                    @media (max-width: 639px) {
                      .financial-desk-table-scroll {
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
                  <div className="financial-desk-table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', fontSize: '14px' }}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Operator Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Total Entries</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Total Amount (GH₵)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialAuditData.deskAttendants.map((attendant, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{attendant.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#4b5563' }}>{attendant.entries}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>GH₵ {attendant.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* Module B: Top Donors & VIP Acknowledgment List */}
        {modalSection === 'donors' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm" style={{ overflow: 'hidden' }}>
            <div className="p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Top Donors & VIP Acknowledgment List</h2>
                <p className="text-sm text-gray-500">Highlight major contributors for personalized thank you notes</p>
              </div>
            </div>
              <div style={{ padding: '16px' }}>
                <style>
                  {`@media (min-width: 640px) {
                    .donors-table-scroll {
                      margin-left: 0 !important;
                      margin-right: 0 !important;
                      padding-left: 0 !important;
                      padding-right: 0 !important;
                    }
                  }
                  @media (max-width: 639px) {
                    .donors-table-scroll {
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
                <div className="donors-table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Rank</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Donor Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Amount (GH₵)</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Phone Number</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDonors.map((donor, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', color: '#4f46e5' }}>#{donor.rank}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{donor.name}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold', color: '#111827' }}>GH₵ {donor.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#4b5563' }}>{donor.phone}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: donor.type === 'VIP' ? '#f3e8ff' : '#f3f4f6', color: donor.type === 'VIP' ? '#6b21a8' : '#374151' }}>
                              {donor.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        )}

        {/* Module C: Refreshment & Catering Audit */}
        {modalSection === 'refreshment' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm" style={{ overflow: 'hidden' }}>
            <div className="p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Refreshment & Catering Audit</h2>
                <p className="text-sm text-gray-500">Chit issuance breakdown for vendor reconciliation</p>
              </div>
            </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Chit Type Breakdown</h4>
                  <div className="space-y-3">
                    {refreshmentAuditData.chitBreakdown.map((item, index) => (
                      <div key={index} className="relative group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{item.type}</span>
                          <span className="text-sm text-gray-600">{item.count} chits ({item.percentage}%)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.count} {item.type} chits issued
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Daily Issuance Breakdown</h4>
                  <style>
                    {`@media (min-width: 640px) {
                      .catering-table-scroll {
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                      }
                    }
                    @media (max-width: 639px) {
                      .catering-table-scroll {
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
                  <div className="catering-table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '600px', textAlign: 'center', fontSize: '14px' }}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Event Day</th>
                          {VOUCHER_TYPE_KEYS.map((key) => (
                            <th key={key} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{VOUCHER_TYPE_LABELS[key]}</th>
                          ))}
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Daily Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refreshmentAuditData.dailyIssuance.map((day, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827', textAlign: 'center' }}>{day.day}</td>
                            {VOUCHER_TYPE_KEYS.map((key) => (
                              <td key={key} style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#4b5563' }}>{day[key]}</td>
                            ))}
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold', color: '#111827' }}>{VOUCHER_TYPE_KEYS.reduce((sum, key) => sum + (day[key] || 0), 0)}</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#fef3c7', fontWeight: 'bold' }}>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#92400e', textAlign: 'center' }}>Grand Total</td>
                          {VOUCHER_TYPE_KEYS.map((key) => (
                            <td key={key} style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#b45309' }}>{refreshmentAuditData.dailyIssuance.reduce((sum, day) => sum + (day[key] || 0), 0)}</td>
                          ))}
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: '#92400e' }}>{summaryData.totalChitsIssued}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Catering Reconciliation Insight</p>
                    <p className="text-xs text-blue-700 mt-1">Based on current chit issuance, {summaryData.totalChitsIssued} guests have been catered for. Compare this with vendor invoices to identify any discrepancies in service delivery.</p>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}