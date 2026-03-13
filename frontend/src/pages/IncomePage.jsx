import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIncome, createIncome, updateIncome, deleteIncome, getSources } from '../api/income';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function IncomeForm({ income, sources, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    amount: income?.amount || '',
    description: income?.description || '',
    source: income?.source || '',
    date: income?.date || new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input name="description" value={form.description} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
        <input name="source" value={form.source} onChange={handleChange} required list="income-sources"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        <datalist id="income-sources">
          {sources?.map((s) => <option key={s.id} value={s.name} />)}
        </datalist>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input name="date" type="date" value={form.date} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
      </div>
    </form>
  );
}

export default function IncomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: incomeData, isLoading } = useQuery({
    queryKey: ['income', search],
    queryFn: () => getIncome({ search }).then((r) => r.data),
  });

  const { data: sources } = useQuery({
    queryKey: ['income-sources'],
    queryFn: () => getSources().then((r) => r.data?.results || r.data),
  });

  const createMutation = useMutation({
    mutationFn: createIncome,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); toast.success('Income added'); setModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateIncome(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); toast.success('Income updated'); setModalOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); toast.success('Income deleted'); },
  });

  const incomes = incomeData?.results || incomeData || [];

  const handleSubmit = (form) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Income</h2>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Income
        </button>
      </div>

      <input
        type="text"
        placeholder="Search income..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
      />

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 font-medium text-gray-500">Description</th>
              <th className="px-4 py-3 font-medium text-gray-500">Source</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {incomes.map((inc) => (
              <tr key={inc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{formatDate(inc.date)}</td>
                <td className="px-4 py-3">{inc.description}</td>
                <td className="px-4 py-3">{inc.source}</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(inc.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(inc); setModalOpen(true); }} className="text-indigo-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => { if (confirm('Delete this income?')) deleteMutation.mutate(inc.id); }} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {incomes.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No income found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Income' : 'Add Income'}>
        <IncomeForm income={editing} sources={sources} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
