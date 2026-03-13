import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, createAsset, updateAsset, deleteAsset, getAssetCategories, getAssetSummary } from '../api/assets';
import { formatCurrency } from '../utils/formatCurrency';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function AssetForm({ asset, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: asset?.name || '', category: asset?.category || '', ticker_symbol: asset?.ticker_symbol || '',
    quantity: asset?.quantity || 1, purchase_price: asset?.purchase_price || '', current_price: asset?.current_price || '',
    purchase_date: asset?.purchase_date || new Date().toISOString().split('T')[0], notes: asset?.notes || '',
  });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="clay-input" placeholder="Asset name" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Category</label>
        <select name="category" value={form.category} onChange={handleChange} required className="clay-input">
          <option value="">Select category</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Ticker Symbol (optional)</label>
        <input name="ticker_symbol" value={form.ticker_symbol} onChange={handleChange} className="clay-input" placeholder="e.g. AAPL" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Quantity</label>
          <input name="quantity" type="number" step="0.0001" value={form.quantity} onChange={handleChange} required className="clay-input" /></div>
        <div><label className="block text-sm font-semibold text-gray-600 mb-2">Purchase Price</label>
          <input name="purchase_price" type="number" step="0.01" value={form.purchase_price} onChange={handleChange} required className="clay-input" /></div>
      </div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Current Price</label>
        <input name="current_price" type="number" step="0.01" value={form.current_price} onChange={handleChange} required className="clay-input" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Purchase Date</label>
        <input name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange} required className="clay-input" /></div>
      <div><label className="block text-sm font-semibold text-gray-600 mb-2">Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="clay-input" /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="clay-btn clay-btn-ghost px-5">Cancel</button>
        <button type="submit" className="clay-btn px-5">Save</button>
      </div>
    </form>
  );
}

export default function AssetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: assetsData, isLoading } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets().then((r) => r.data) });
  const { data: categories } = useQuery({ queryKey: ['asset-categories'], queryFn: () => getAssetCategories().then((r) => r.data?.results || r.data) });
  const { data: summary } = useQuery({ queryKey: ['asset-summary'], queryFn: () => getAssetSummary().then((r) => r.data) });

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['assets'] }); queryClient.invalidateQueries({ queryKey: ['asset-summary'] }); };
  const createMutation = useMutation({ mutationFn: createAsset, onSuccess: () => { invalidate(); toast.success('Asset added'); setModalOpen(false); }, onError: () => toast.error('Failed to add asset') });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateAsset(id, data), onSuccess: () => { invalidate(); toast.success('Updated'); setModalOpen(false); setEditing(null); } });
  const deleteMutation = useMutation({ mutationFn: deleteAsset, onSuccess: () => { invalidate(); toast.success('Deleted'); } });

  const assets = assetsData?.results || assetsData || [];
  const handleSubmit = (form) => editing ? updateMutation.mutate({ id: editing.id, data: form }) : createMutation.mutate(form);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Assets</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="clay-btn text-sm">+ Add Asset</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Value</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.total_value)}</p>
          </div>
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Cost</p>
            <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(summary.total_cost)}</p>
          </div>
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Gain/Loss</p>
            <p className={`text-xl font-bold mt-1 ${summary.total_gain_loss >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{formatCurrency(summary.total_gain_loss)}</p>
          </div>
          <div className="clay-card p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Assets Count</p>
            <p className="text-xl font-bold text-gray-700 mt-1">{summary.asset_count}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="clay-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{asset.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{asset.category_name}{asset.ticker_symbol ? ` (${asset.ticker_symbol})` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(asset); setModalOpen(true); }} className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(asset.id); }} className="text-xs text-rose-400 font-semibold hover:text-rose-600">Delete</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Value</p>
                <p className="font-bold text-gray-800">{formatCurrency(asset.current_value)}</p>
              </div>
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Cost</p>
                <p className="font-bold text-gray-700">{formatCurrency(asset.cost_basis)}</p>
              </div>
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Gain/Loss</p>
                <p className={`font-bold ${asset.gain_loss >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {formatCurrency(asset.gain_loss)} <span className="text-xs">({asset.gain_loss_percentage?.toFixed(1)}%)</span>
                </p>
              </div>
              <div className="clay-card-flat p-3 rounded-xl">
                <p className="text-xs text-gray-400">Qty</p>
                <p className="font-bold text-gray-700">{asset.quantity}</p>
              </div>
            </div>
          </div>
        ))}
        {assets.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No assets yet. Add your first asset to get started.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Asset' : 'Add Asset'}>
        <AssetForm asset={editing} categories={categories} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
