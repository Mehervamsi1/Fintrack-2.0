import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, createExpense, updateExpense, deleteExpense, getCategories } from '../api/expenses';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import client from '../api/client';

function ExpenseForm({ expense, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    amount: expense?.amount || '',
    description: expense?.description || '',
    category: expense?.category || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
  });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Amount</label>
        <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required className="clay-input" placeholder="0.00" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Description</label>
        <input name="description" value={form.description} onChange={handleChange} required className="clay-input" placeholder="What was this expense for?" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Category</label>
        <input name="category" value={form.category} onChange={handleChange} required list="expense-categories" className="clay-input" placeholder="Type or select category" />
        <datalist id="expense-categories">
          {categories?.map((c) => <option key={c.id} value={c.name} />)}
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

export default function ExpensesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [newCat, setNewCat] = useState('');
  const queryClient = useQueryClient();

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', search],
    queryFn: () => getExpenses({ search }).then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => getCategories().then((r) => r.data?.results || r.data),
  });

  const createMutation = useMutation({ mutationFn: createExpense, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense added'); setModalOpen(false); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateExpense(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Updated'); setModalOpen(false); setEditing(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteExpense, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Deleted'); } });

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await client.post('/expenses-categories/', { name: newCat.trim() });
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    setNewCat('');
    toast.success('Category added');
  };
  const deleteCategory = async (id) => {
    await client.delete(`/expenses-categories/${id}/`);
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    toast.success('Category removed');
  };

  const expenses = expensesData?.results || expensesData || [];
  const handleSubmit = (form) => editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
        <div className="flex gap-2">
          <button onClick={() => setCatModalOpen(true)} className="clay-btn clay-btn-ghost text-xs px-4">Manage Categories</button>
          <button onClick={() => { setEditing(null); setModalOpen(true); }} className="clay-btn text-sm">+ Add Expense</button>
        </div>
      </div>

      <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="clay-input max-w-xs" />

      <div className="clay-card overflow-hidden" style={{ borderRadius: '20px' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/30">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-white/30 transition-colors border-t border-white/30">
                <td className="px-5 py-3.5 text-gray-600">{formatDate(exp.date)}</td>
                <td className="px-5 py-3.5 font-medium text-gray-800">{exp.description}</td>
                <td className="px-5 py-3.5"><span className="clay-card-flat px-3 py-1 text-xs font-semibold text-gray-600">{exp.category}</span></td>
                <td className="px-5 py-3.5 text-right font-bold text-rose-500">{formatCurrency(exp.amount)}</td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => { setEditing(exp); setModalOpen(true); }} className="text-indigo-500 hover:text-indigo-700 text-xs font-semibold mr-3">Edit</button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(exp.id); }} className="text-rose-500 hover:text-rose-700 text-xs font-semibold">Delete</button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">No expenses found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm expense={editing} categories={categories} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>

      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title="Manage Expense Categories">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name..." className="clay-input flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} />
            <button onClick={addCategory} className="clay-btn px-4">Add</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories?.map((c) => (
              <div key={c.id} className="flex items-center justify-between clay-card-flat px-4 py-2.5">
                <span className="text-sm font-medium text-gray-700">{c.name}</span>
                <button onClick={() => deleteCategory(c.id)} className="text-rose-400 hover:text-rose-600 text-xs font-semibold">Remove</button>
              </div>
            ))}
            {(!categories || categories.length === 0) && <p className="text-center text-sm text-gray-400 py-4">No categories yet</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
