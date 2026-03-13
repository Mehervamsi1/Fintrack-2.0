import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, createAsset, updateAsset, deleteAsset, getAssetCategories, getAssetSummary } from '../api/assets';
import { formatCurrency } from '../utils/formatCurrency';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function AssetForm({ asset, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: asset?.name || '',
    category: asset?.category || '',
    ticker_symbol: asset?.ticker_symbol || '',
    quantity: asset?.quantity || 1,
    purchase_price: asset?.purchase_price || '',
    current_price: asset?.current_price || '',
    purchase_date: asset?.purchase_date || new Date().toISOString().split('T')[0],
    notes: asset?.notes || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select name="category" value={form.category} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">Select category</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ticker Symbol (optional)</label>
        <input name="ticker_symbol" value={form.ticker_symbol} onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input name="quantity" type="number" step="0.0001" value={form.quantity} onChange={handleChange} required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
          <input name="purchase_price" type="number" step="0.01" value={form.purchase_price} onChange={handleChange} required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
        <input name="current_price" type="number" step="0.01" value={form.current_price} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
        <input name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange} required
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
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

export default function AssetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => getAssets().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: () => getAssetCategories().then((r) => r.data?.results || r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['asset-summary'],
    queryFn: () => getAssetSummary().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assets'] }); queryClient.invalidateQueries({ queryKey: ['asset-summary'] }); toast.success('Asset added'); setModalOpen(false); },
    onError: () => toast.error('Failed to add asset'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assets'] }); queryClient.invalidateQueries({ queryKey: ['asset-summary'] }); toast.success('Asset updated'); setModalOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assets'] }); queryClient.invalidateQueries({ queryKey: ['asset-summary'] }); toast.success('Asset deleted'); },
  });

  const assets = assetsData?.results || assetsData || [];

  const handleSubmit = (form) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assets</h2>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.total_value)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-xl font-bold">{formatCurrency(summary.total_cost)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Gain/Loss</p>
            <p className={`text-xl font-bold ${summary.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.total_gain_loss)}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Assets Count</p>
            <p className="text-xl font-bold">{summary.asset_count}</p>
          </div>
        </div>
      )}

      {/* Asset Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white rounded-xl border p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{asset.name}</h3>
                <p className="text-xs text-gray-500">{asset.category_name}{asset.ticker_symbol ? ` (${asset.ticker_symbol})` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(asset); setModalOpen(true); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(asset.id); }} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div>
                <p className="text-gray-500">Current Value</p>
                <p className="font-semibold">{formatCurrency(asset.current_value)}</p>
              </div>
              <div>
                <p className="text-gray-500">Cost Basis</p>
                <p className="font-semibold">{formatCurrency(asset.cost_basis)}</p>
              </div>
              <div>
                <p className="text-gray-500">Gain/Loss</p>
                <p className={`font-semibold ${asset.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(asset.gain_loss)} ({asset.gain_loss_percentage?.toFixed(1)}%)
                </p>
              </div>
              <div>
                <p className="text-gray-500">Quantity</p>
                <p className="font-semibold">{asset.quantity}</p>
              </div>
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center py-8">No assets yet. Add your first asset to get started.</p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Asset' : 'Add Asset'}>
        <AssetForm asset={editing} categories={categories} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
