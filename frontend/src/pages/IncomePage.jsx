import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIncome, createIncome, updateIncome, deleteIncome, getSources } from '../api/income';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import client from '../api/client';

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
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Amount</label>
        <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required className="clay-input" placeholder="0.00" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Description</label>
        <input name="description" value={form.description} onChange={handleChange} required className="clay-input" placeholder="Income description" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Source</label>
        <input name="source" value={form.source} onChange={handleChange} required list="income-sources" className="clay-input" placeholder="Type or select source" />
        <datalist id="income-sources">
          {sources?.map((s) => <option key={s.id} value={s.name} />)}
        </datalist></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
        <input name="date" type="date" value={form.date} onChange={handleChange} required className="clay-input" /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="clay-btn clay-btn-ghost px-5">Cancel</button>
        <button type="submit" className="clay-btn px-5">Save</button>
      </div>
    </form>
  );
}

export default function IncomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [srcModalOpen, setSrcModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [newSrc, setNewSrc] = useState('');
  const queryClient = useQueryClient();

  const { data: incomeData, isLoading } = useQuery({ queryKey: ['income', search], queryFn: () => getIncome({ search }).then((r) => r.data) });
  const { data: sources } = useQuery({ queryKey: ['income-sources'], queryFn: () => getSources().then((r) => r.data?.results || r.data) });

  const createMutation = useMutation({ mutationFn: createIncome, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); toast.success('Income added'); setModalOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateIncome(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); toast.success('Updated'); setModalOpen(false); setEditing(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteIncome, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['income'] }); toast.success('Deleted'); } });

  const addSource = async () => {
    if (!newSrc.trim()) return;
    await client.post('/income-sources/', { name: newSrc.trim() });
    queryClient.invalidateQueries({ queryKey: ['income-sources'] });
    setNewSrc('');
    toast.success('Source added');
  };
  const deleteSource = async (id) => {
    await client.delete(`/income-sources/${id}/`);
    queryClient.invalidateQueries({ queryKey: ['income-sources'] });
    toast.success('Source removed');
  };

  const incomes = incomeData?.results || incomeData || [];
  const handleSubmit = (form) => editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Income</h2>
        <div className="flex gap-2">
          <button onClick={() => setSrcModalOpen(true)} className="clay-btn clay-btn-ghost text-xs px-4">Manage Sources</button>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="clay-btn text-sm">+ Add Income</button>
        </div>
      </div>

      <input type="text" placeholder="Search income..." value={search} onChange={(e) => setSearch(e.target.value)} className="clay-input max-w-xs" />

      <div className="clay-card overflow-hidden" style={{ borderRadius: '20px' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/30">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((inc) => (
              <tr key={inc.id} className="hover:bg-white/30 transition-colors border-t border-white/30">
                <td className="px-5 py-3.5 text-gray-600">{formatDate(inc.date)}</td>
                <td className="px-5 py-3.5 font-medium text-gray-800">{inc.description}</td>
                <td className="px-5 py-3.5"><span className="clay-card-flat px-3 py-1 text-xs font-semibold text-gray-600">{inc.source}</span></td>
                <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{formatCurrency(inc.amount)}</td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => { setEditing(inc); setModalOpen(true); }} className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold mr-3">Edit</button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(inc.id); }} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">Delete</button>
                </td>
              </tr>
            ))}
            {incomes.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">No income found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Income' : 'Add Income'}>
        <IncomeForm income={editing} sources={sources} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>

      <Modal open={srcModalOpen} onClose={() => setSrcModalOpen(false)} title="Manage Income Sources">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newSrc} onChange={(e) => setNewSrc(e.target.value)} placeholder="New source name..." className="clay-input flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSource(); } }} />
            <button onClick={addSource} className="clay-btn px-4">Add</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sources?.map((s) => (
              <div key={s.id} className="flex items-center justify-between clay-card-flat px-4 py-2.5">
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
                <button onClick={() => deleteSource(s.id)} className="text-rose-400 hover:text-rose-600 text-xs font-semibold">Remove</button>
              </div>
            ))}
            {(!sources || sources.length === 0) && <p className="text-center text-sm text-gray-400 py-4">No sources yet</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
