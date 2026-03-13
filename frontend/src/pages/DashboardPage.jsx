import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/dashboard';
import { getCategories } from '../api/expenses';
import { getSources } from '../api/income';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function StatCard({ label, value, color, icon }) {
  return (
    <div className="clay-card p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${icon}`}>
          <span className="text-lg">{label === 'Total Assets' ? '&#9650;' : label === 'Total Liabilities' ? '&#9660;' : label === 'Monthly Income' ? '+' : '-'}</span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardSummary().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => getCategories().then((r) => r.data?.results || r.data),
  });

  const { data: sources } = useQuery({
    queryKey: ['income-sources'],
    queryFn: () => getSources().then((r) => r.data?.results || r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <p className="text-gray-500">No data available</p>;

  const filteredTransactions = data.recent_transactions?.filter((txn) => {
    if (filter === 'all') return true;
    if (filter === 'income') return txn.type === 'income';
    if (filter === 'expenses') return txn.type === 'expense';
    if (filter.startsWith('cat:')) {
      const catName = filter.slice(4);
      return txn.type === 'expense' && txn.category === catName;
    }
    if (filter.startsWith('src:')) {
      const srcName = filter.slice(4);
      return txn.type === 'income' && txn.source === srcName;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Net Worth Banner */}
      <div className="clay-card p-6 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))',
        border: '1px solid rgba(255,255,255,0.3)',
      }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-6 -mb-6" />
        <div className="relative">
          <p className="text-indigo-100 text-sm font-medium">Net Worth</p>
          <p className="text-4xl font-extrabold text-white mt-1">{formatCurrency(data.net_worth)}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-indigo-200 text-xs">Monthly Savings</p>
              <p className="text-white font-bold text-lg">{formatCurrency(data.monthly_savings)}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs">Savings Rate</p>
              <p className="text-white font-bold text-lg">
                {data.monthly_income > 0 ? `${((data.monthly_savings / data.monthly_income) * 100).toFixed(0)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={formatCurrency(data.total_assets)} color="text-emerald-600" icon="bg-emerald-100 text-emerald-600" />
        <StatCard label="Total Liabilities" value={formatCurrency(data.total_liabilities)} color="text-rose-600" icon="bg-rose-100 text-rose-600" />
        <StatCard label="Monthly Income" value={formatCurrency(data.monthly_income)} color="text-emerald-600" icon="bg-emerald-100 text-emerald-600" />
        <StatCard label="Monthly Expenses" value={formatCurrency(data.monthly_expenses)} color="text-rose-600" icon="bg-rose-100 text-rose-600" />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'income', 'expenses'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === f ? 'clay-btn text-white' : 'clay-card-flat text-gray-500 hover:text-gray-700 cursor-pointer'
            }`}>
            {f}
          </button>
        ))}
        {categories?.length > 0 && (
          <select onChange={(e) => setFilter(e.target.value)} className="clay-input py-2 px-3 text-xs w-auto" style={{ width: 'auto', minWidth: '140px' }}>
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={`cat:${c.name}`}>{c.name}</option>)}
          </select>
        )}
        {sources?.length > 0 && (
          <select onChange={(e) => setFilter(e.target.value)} className="clay-input py-2 px-3 text-xs w-auto" style={{ width: 'auto', minWidth: '140px' }}>
            <option value="all">All Sources</option>
            {sources.map((s) => <option key={s.id} value={`src:${s.name}`}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {data.assets_breakdown?.length > 0 && (
          <div className="clay-card p-5">
            <h3 className="font-bold text-gray-700 mb-4">Asset Allocation</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.assets_breakdown} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {data.assets_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.monthly_trend?.length > 0 && (
          <div className="clay-card p-5">
            <h3 className="font-bold text-gray-700 mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthly_trend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#f87171" name="Expenses" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {filteredTransactions.length > 0 && (
        <div className="clay-card p-5">
          <h3 className="font-bold text-gray-700 mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {filteredTransactions.map((txn, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-white/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                    txn.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {txn.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{txn.description}</p>
                    <p className="text-xs text-gray-400">{txn.category || txn.source} &middot; {formatDate(txn.date)}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${txn.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
