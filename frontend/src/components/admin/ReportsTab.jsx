import { useState, useEffect } from 'react';
import { Download, FileText, Utensils, BarChart, Calendar, Info, Loader2, RefreshCw, Users } from 'lucide-react';
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
  const [modalSection, setModalSection] = useState(null);
  const [, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [exporting, setExporting] = useState(null);
  
  // Data state
  const [summaryData, setSummaryData] = useState(null);
  const [financialAuditData, setFinancialAuditData] = useState(null);
  const [refreshmentAuditData, setRefreshmentAuditData] = useState(null);
  const [expenseData, setExpenseData] = useState([]);

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
        setRefreshmentAuditData(data.refreshmentAudit);
        setExpenseData(data.expenses || []);
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

  const handleDonorListExport = async () => {
    if (exporting) return;
    setExporting('donor-list');
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.REPORTS}export/donor-list/`);
      if (response.ok) {
        const blob = await response.blob();
        triggerDownload(blob, `solacehub-donor-list-${new Date().toISOString().slice(0, 10)}.csv`);
      } else {
        console.error('Donor list export failed:', response.status);
      }
    } catch (err) {
      console.error('Donor list export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleDonorListPDF = async () => {
    if (exporting) return;
    setExporting('donor-list-pdf');
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.REPORTS}export/donor-list-pdf/`);
      if (response.ok) {
        const blob = await response.blob();
        triggerDownload(blob, `solacehub-donor-list-${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        console.error('Donor list PDF export failed:', response.status);
      }
    } catch (err) {
      console.error('Donor list PDF export failed:', err);
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
          <button
            onClick={handleDonorListExport}
            disabled={!!exporting}
            className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting === 'donor-list' ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            {exporting === 'donor-list' ? 'Exporting...' : 'Download Donor List'}
          </button>
          <button
            onClick={handleDonorListPDF}
            disabled={!!exporting}
            className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting === 'donor-list-pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {exporting === 'donor-list-pdf' ? 'Generating...' : 'Download Donor List PDF'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-4 pb-1" style={{ minWidth: 'max-content' }}>
          <div className="w-64 shrink-0 rounded-xl px-4 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
            <p className="text-[11px] font-medium text-white/80 mb-0.5">Total Revenue</p>
            <p className="text-sm font-bold text-white whitespace-nowrap">GH₵ {summaryData.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="w-64 shrink-0 rounded-xl px-4 py-3 bg-amber-50 border border-amber-200 shadow-sm">
            <p className="text-[11px] font-medium text-amber-700 mb-0.5">Total Expenses</p>
            <p className="text-sm font-bold text-amber-600 whitespace-nowrap">GH₵ {summaryData.totalExpenses.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="w-64 shrink-0 rounded-xl px-4 py-3 bg-gradient-to-br from-slate-800 to-slate-900 shadow-sm">
            <p className="text-[11px] font-medium text-gray-400 mb-0.5">Net Proceeds</p>
            <p className="text-sm font-bold text-emerald-400 whitespace-nowrap">GH₵ {summaryData.netRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="w-64 shrink-0 rounded-xl px-4 py-3 bg-indigo-50 border border-indigo-100 shadow-sm">
            <p className="text-[11px] font-medium text-indigo-500 mb-0.5">Total Donors</p>
            <p className="text-sm font-bold text-indigo-600 whitespace-nowrap">{summaryData.totalDonors}</p>
          </div>

          <div className="w-64 shrink-0 rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-100 shadow-sm">
            <p className="text-[11px] font-medium text-emerald-600 mb-0.5">Refreshment Vouchers</p>
            <p className="text-sm font-bold text-emerald-700 whitespace-nowrap">{summaryData.totalChitsIssued}</p>
          </div>

          <div className="w-64 shrink-0 rounded-xl px-4 py-3 bg-purple-50 border border-purple-100 shadow-sm">
            <p className="text-[11px] font-medium text-purple-500 mb-0.5">Average Donation</p>
            <p className="text-sm font-bold text-purple-600 whitespace-nowrap">GH₵ {summaryData.averageDonation.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          </div>
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
                  <h3 className="text-lg font-bold mb-4">Audit Details</h3>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-300">Family: <span className="font-semibold text-white">{financialAuditData.familyName || '—'}</span></p>
                    <p className="text-gray-300">Event Type: <span className="font-semibold text-white">{financialAuditData.eventType || '—'}</span></p>
                    <p className="text-gray-300">Deceased Name: <span className="font-semibold text-white">{financialAuditData.deceasedName || '—'}</span></p>
                    {financialAuditData.memorialDates && (
                      <p className="text-gray-300 flex items-center gap-2">
                        <Calendar size={14} /> Memorial Dates: <span className="font-semibold text-white">{financialAuditData.memorialDates}</span>
                      </p>
                    )}
                  </div>
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

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Expense Audit Log</h4>
                  <style>
                    {`@media (min-width: 640px) {
                      .financial-expense-table-scroll {
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                      }
                    }
                    @media (max-width: 639px) {
                      .financial-expense-table-scroll {
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
                  <div className="financial-expense-table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
                    {expenseData.length === 0 ? (
                      <p className="text-sm text-gray-500">No expenses recorded yet.</p>
                    ) : (
                      <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', fontSize: '14px' }}>
                        <thead style={{ backgroundColor: '#f9fafb' }}>
                          <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Description</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Amount (GH₵)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseData.map((expense, index) => (
                            <tr key={expense.id ?? index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827', whiteSpace: 'nowrap' }}>{expense.description}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#4b5563', whiteSpace: 'nowrap' }}>{expense.date || '—'}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold', color: '#b45309', whiteSpace: 'nowrap' }}>GH₵ {expense.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr style={{ backgroundColor: '#fffbeb', fontWeight: 'bold' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#92400e' }}>Total Expenses</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#92400e' }}></td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#92400e' }}>GH₵ {summaryData.totalExpenses.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Net Position</h4>
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
                      <div>
                        <p className="text-sm text-gray-300 mb-1">Total Revenue</p>
                        <p className="text-xl font-bold">GH₵ {summaryData.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300 mb-1">Total Expenses</p>
                        <p className="text-xl font-bold">GH₵ {summaryData.totalExpenses.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300 mb-1">Net Proceeds</p>
                        <p className="text-xl font-bold text-emerald-400">GH₵ {summaryData.netRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
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