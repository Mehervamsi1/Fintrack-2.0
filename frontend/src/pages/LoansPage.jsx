import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoans, createLoan, updateLoan, deleteLoan, getLoanSummary } from '../api/loans';
import { formatCurrency } from '../utils/formatCurrency';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const LOAN_TYPES = [
  { value: 'home', label: 'Home Loan' }, { value: 'car', label: 'Car Loan' },
  { value: 'personal', label: 'Personal Loan' }, { value: 'education', label: 'Education Loan' },
  { value: 'credit_card', label: 'Credit Card' }, { value: 'business', label: 'Business Loan' },
  { value: 'other', label: 'Other' },
];

function LoanForm({ loan, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: loan?.name || '', loan_type: loan?.loan_type || 'personal',
    principal_amount: loan?.principal_amount || '', outstanding_balance: loan?.outstanding_balance || '',
    interest_rate: loan?.interest_rate || '', emi_amount: loan?.emi_amount || '',
    start_date: loan?.start_date || new Date().toISOString().split('T')[0],
    end_date: loan?.end_date || '', lender: loan?.lender || '', notes: loan?.notes || '',
  });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="clay-input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Type</label>
          <select name="loan_type" value={form.loan_type} onChange={handleChange} className="clay-input">
            {LOAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select></div>
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Lender</label>
          <input name="lender" value={form.lender} onChange={handleChange} className="clay-input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Principal</label>
          <input name="principal_amount" type="number" step="0.01" value={form.principal_amount} onChange={handleChange} required className="clay-input" /></div>
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Outstanding</label>
          <input name="outstanding_balance" type="number" step="0.01" value={form.outstanding_balance} onChange={handleChange} required className="clay-input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Interest Rate (%)</label>
          <input name="interest_rate" type="number" step="0.01" value={form.interest_rate} onChange={handleChange} required className="clay-input" /></div>
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">EMI Amount</label>
          <input name="emi_amount" type="number" step="0.01" value={form.emi_amount} onChange={handleChange} className="clay-input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Start Date</label>
          <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required className="clay-input" /></div>
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">End Date</label>
          <input name="end_date" type="date" value={form.end_date} onChange={handleChange} className="clay-input" /></div>
      </div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="clay-input" /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="clay-btn clay-btn-ghost px-5">Cancel</button>
        <button type="submit" className="clay-btn px-5">Save</button>
      </div>
    </form>
  );
}

export default function LoansPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: loansData, isLoading } = useQuery({ queryKey: ['loans'], queryFn: () => getLoans().then((r) => r.data) });
  const { data: summary } = useQuery({ queryKey: ['loan-summary'], queryFn: () => getLoanSummary().then((r) => r.data) });

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['loans'] }); queryClient.invalidateQueries({ queryKey: ['loan-summary'] }); };
  const createMutation = useMutation({ mutationFn: createLoan, onSuccess: () => { invalidate(); toast.success('Loan added'); setModalOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateLoan(id, data), onSuccess: () => { invalidate(); toast.success('Updated'); setModalOpen(false); setEditing(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteLoan, onSuccess: () => { invalidate(); toast.success('Deleted'); } });

  const loans = loansData?.results || loansData || [];
  const handleSubmit = (form) => {
    const data = { ...form };
    if (!data.emi_amount) delete data.emi_amount;
    if (!data.end_date) delete data.end_date;
    editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Loans</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="clay-btn text-sm">+ Add Loan</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Principal</p>
            <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(summary.total_principal)}</p>
          </div>
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Outstanding</p>
            <p className="text-xl font-bold text-rose-500 mt-1">{formatCurrency(summary.total_outstanding)}</p>
          </div>
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Paid</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.total_paid)}</p>
          </div>
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Monthly EMI</p>
            <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(summary.monthly_emi)}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {loans.map((loan) => (
          <div key={loan.id} className="clay-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{loan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{loan.loan_type_display} {loan.lender ? `- ${loan.lender}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(loan); setModalOpen(true); }} className="text-xs text-indigo-500 font-semibold">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(loan.id); }} className="text-xs text-rose-400 font-semibold">Delete</button>
              </div>
            </div>
            <div className="clay-progress mb-2">
              <div className="clay-progress-bar" style={{ width: `${Math.min(loan.completion_percentage, 100)}%` }} />
            </div>
            <p className="text-xs font-semibold text-indigo-600 mb-4">{loan.completion_percentage?.toFixed(1)}% paid off</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Principal</p>
                <p className="font-bold">{formatCurrency(loan.principal_amount)}</p>
              </div>
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Outstanding</p>
                <p className="font-bold text-rose-500">{formatCurrency(loan.outstanding_balance)}</p>
              </div>
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Interest</p>
                <p className="font-bold">{loan.interest_rate}%</p>
              </div>
              {loan.emi_amount && (
                <div className="clay-card-flat p-3 rounded-xl">
                  <p className="text-xs text-gray-400">EMI</p>
                  <p className="font-bold">{formatCurrency(loan.emi_amount)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loans.length === 0 && <p className="text-gray-400 col-span-2 text-center py-12">No loans yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Loan' : 'Add Loan'}>
        <LoanForm loan={editing} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
