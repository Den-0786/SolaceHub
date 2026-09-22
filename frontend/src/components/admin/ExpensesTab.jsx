import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Pencil, Loader2, TrendingDown, FileText, X } from 'lucide-react';
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

  const [editingExpense, setEditingExpense] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editSpentBy, setEditSpentBy] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setEditDescription(expense.description || '');
    setEditSpentBy(expense.spent_by || '');
    setEditAmount(expense.amount != null ? String(expense.amount) : '');
    setEditDate(expense.date || '');
    setEditError('');
  };

  const handleUpdate = async () => {
    setEditError('');
    const parsedAmount = parseFloat(editAmount);
    if (!editDescription.trim()) {
      setEditError('Please enter a description for the expense.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setEditError('Please enter a valid amount greater than zero.');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.EXPENSES}${editingExpense.id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          description: editDescription.trim(),
          spent_by: editSpentBy.trim(),
          amount: parsedAmount,
          date: editDate || null,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        setEditingExpense(null);
      } else {
        const detail = await response.json().catch(() => ({}));
        setEditError(detail.detail || detail.description || 'Failed to update expense. Please try again.');
      }
    } catch (err) {
      console.error('Failed to update expense:', err);
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
      const response = await fetchWithAuth(`${API_CONFIG.ENDPOINTS.EXPENSES}${pendingDelete.id}/`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== pendingDelete.id));
        setPendingDelete(null);
      } else {
        setDeleteError('Failed to delete expense. Please try again.');
        console.error('Failed to delete expense:', response.status);
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(expense)}
                          title="Edit expense"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid #dbeafe', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', cursor: 'pointer' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteError(''); setPendingDelete(expense); }}
                          title="Delete expense"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div
          onClick={() => !updating && setEditingExpense(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Edit Expense</h2>
              <button
                onClick={() => !updating && setEditingExpense(null)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: 'none', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Spent by</label>
                <input
                  type="text"
                  value={editSpentBy}
                  onChange={(e) => setEditSpentBy(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
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
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Date (optional)</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', width: '100%' }}
                  />
                </div>
              </div>
              {editError && (
                <p style={{ fontSize: '13px', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>
                  {editError}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <button
                onClick={() => setEditingExpense(null)}
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
                {updating ? <Loader2 size={16} className="animate-spin" /> : null} {updating ? 'Updating...' : 'Update Expense'}
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
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Delete Expense?</h2>
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
                <strong style={{ color: '#111827' }}>{pendingDelete.description}</strong>{' '}
                ({formatAmount(pendingDelete.amount)})? This will remove it from the audit breakdown.
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