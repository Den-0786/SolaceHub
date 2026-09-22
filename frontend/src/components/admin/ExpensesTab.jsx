import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Loader2, TrendingDown, FileText } from 'lucide-react';
import { API_CONFIG, fetchWithAuth } from '../../config/api.js';

const formatAmount = (value) =>
  `GH₵ ${parseFloat(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpensesTab() {
  const [description, setDescription] = useState('');
  const [spentBy, setSpentBy] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.EXPENSES);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.results || data || []);
      } else {
        console.error('Failed to fetch expenses:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAdd = async () => {
    setError('');
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setError('Please enter a description for the expense.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.EXPENSES, {
        method: 'POST',
        body: JSON.stringify({
          description: description.trim(),
          spent_by: spentBy.trim(),
          amount: parsedAmount,
          date: date || null,
        }),
      });
      if (response.ok) {
        const newExpense = await response.json();
        setExpenses((prev) => [newExpense, ...prev]);
        setDescription('');
        setSpentBy('');
        setAmount('');
        setDate('');
      } else {
        const detail = await response.json().catch(() => ({}));
        setError(detail.detail || detail.description || 'Failed to add expense. Please try again.');
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.EXPENSES}${id}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      } else {
        console.error('Failed to delete expense:', response.status);
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-950" size={32} />
          <p className="text-sm text-gray-500">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Expense Tracking</h1>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            Record family expenses here. They are deducted from total donations in the financial audit.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to bottom right, #f59e0b, #d97706)', borderRadius: '16px', padding: '12px 16px', color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <TrendingDown size={18} />
          <div>
            <p style={{ fontSize: '11px', color: '#fef3c7', marginBottom: 0 }}>Total Expenses</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{formatAmount(total)}</p>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>Add New Expense</h2>
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Description</label>
            <input
              type="text"
              placeholder="e.g. Catering ingredients, transport, music band..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
            />
          </div>
          <div className="flex flex-col gap-1 lg:w-44">
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Spent by</label>
            <input
              type="text"
              placeholder="Who paid for it"
              value={spentBy}
              onChange={(e) => setSpentBy(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
            />
          </div>
          <div className="flex flex-col gap-1 lg:w-36">
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Amount (GH₵)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
            />
          </div>
          <div className="flex flex-col gap-1 lg:w-48">
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Date (optional)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="whitespace-nowrap"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 16px', backgroundColor: '#020617', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {saving ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: '13px', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', margin: 0, marginTop: '12px' }}>
            {error}
          </p>
        )}
      </div>

      {/* Expense List */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Recorded Expenses</h2>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{expenses.length} entries</span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          {expenses.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <Wallet size={48} style={{ margin: '0 auto 12px auto', color: '#d1d5db' }} />
              <p style={{ fontSize: '14px', color: '#6b7280' }}>No expenses recorded yet</p>
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Spent By</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Amount (GH₵)</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{expense.description}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{expense.spent_by || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#b45309' }}>{formatAmount(expense.amount)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>{expense.date || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        title="Delete expense"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <FileText size={20} className="text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">How expenses affect the audit</p>
          <p className="text-xs text-blue-700 mt-1">
            Your total donations are reduced by these expenses when the report is generated, so the
            printed audit shows Total Revenue, Total Expenses, and Net Proceeds.
          </p>
        </div>
      </div>
    </div>
  );
}