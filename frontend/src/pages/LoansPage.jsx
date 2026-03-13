import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoans, createLoan, updateLoan, deleteLoan, getLoanSummary } from '../api/loans';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const LOAN_TYPES = [
  { value: 'home', label: 'Home Loan' },
  { value: 'car', label: 'Car Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'business', label: 'Business Loan' },
  { value: 'other', label: 'Other' },
];

function LoanForm({ loan, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: loan?.name || '',
    loan_type: loan?.loan_type || 'personal',
    principal_amount: loan?.principal_amount || '',
    outstanding_balance: loan?.outstanding_balance || '',
    interest_rate: loan?.interest_rate || '',
    emi_amount: loan?.emi_amount || '',
    start_date: loan?.start_date || new Date().toISOString().split('T')[0],
    end_date: loan?.end_date || '',
    lender: loan?.lender || '',
    notes: loan?.notes || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select name="loan_type" value={form.loan_type} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            {LOAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lender</label>
          <input name="lender" value={form.lender} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount</label>
          <input name="principal_amount" type="number" step="0.01" value={form.principal_amount} onChange={handleChange} required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Balance</label>
          <input name="outstanding_balance" type="number" step="0.01" value={form.outstanding_balance} onChange={handleChange} required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
          <input name="interest_rate" type="number" step="0.01" value={form.interest_rate} onChange={handleChange} required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EMI Amount</label>
          <input name="emi_amount" type="number" step="0.01" value={form.emi_amount} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input name="end_date" type="date" value={form.end_date} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
      </div>
    </form>
  );
}

export default function LoansPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: loansData, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => getLoans().then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['loan-summary'],
    queryFn: () => getLoanSummary().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createLoan,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loans'] }); queryClient.invalidateQueries({ queryKey: ['loan-summary'] }); toast.success('Loan added'); setModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLoan(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loans'] }); queryClient.invalidateQueries({ queryKey: ['loan-summary'] }); toast.success('Loan updated'); setModalOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLoan,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['loans'] }); queryClient.invalidateQueries({ queryKey: ['loan-summary'] }); toast.success('Loan deleted'); },
  });

  const loans = loansData?.results || loansData || [];

  const handleSubmit = (form) => {
    const data = { ...form };
    if (!data.emi_amount) delete data.emi_amount;
    if (!data.end_date) delete data.end_date;
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loans</h2>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Loan
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Principal</p>
            <p className="text-xl font-bold">{formatCurrency(summary.total_principal)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.total_outstanding)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.total_paid)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Monthly EMI</p>
            <p className="text-xl font-bold">{formatCurrency(summary.monthly_emi)}</p>
          </div>
        </div>
      )}

      {/* Loan Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {loans.map((loan) => (
          <div key={loan.id} className="bg-white rounded-xl border p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{loan.name}</h3>
                <p className="text-xs text-gray-500">{loan.loan_type_display} {loan.lender ? `- ${loan.lender}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(loan); setModalOpen(true); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(loan.id); }} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(loan.completion_percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mb-3">{loan.completion_percentage?.toFixed(1)}% paid off</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Principal</p>
                <p className="font-semibold">{formatCurrency(loan.principal_amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Outstanding</p>
                <p className="font-semibold text-red-600">{formatCurrency(loan.outstanding_balance)}</p>
              </div>
              <div>
                <p className="text-gray-500">Interest Rate</p>
                <p className="font-semibold">{loan.interest_rate}%</p>
              </div>
              {loan.emi_amount && (
                <div>
                  <p className="text-gray-500">EMI</p>
                  <p className="font-semibold">{formatCurrency(loan.emi_amount)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loans.length === 0 && (
          <p className="text-gray-500 col-span-2 text-center py-8">No loans yet.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Loan' : 'Add Loan'}>
        <LoanForm loan={editing} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
