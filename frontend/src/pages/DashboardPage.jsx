import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/dashboard';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardSummary().then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <p className="text-gray-500">No data available</p>;

  const netWorthColor = data.net_worth >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Net Worth Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white">
        <p className="text-indigo-200 text-sm">Net Worth</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(data.net_worth)}</p>
        <p className="text-indigo-200 mt-2 text-sm">
          Monthly savings: {formatCurrency(data.monthly_savings)}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={formatCurrency(data.total_assets)} color="text-green-600" />
        <StatCard label="Total Liabilities" value={formatCurrency(data.total_liabilities)} color="text-red-600" />
        <StatCard label="Monthly Income" value={formatCurrency(data.monthly_income)} color="text-green-600" />
        <StatCard label="Monthly Expenses" value={formatCurrency(data.monthly_expenses)} color="text-red-600" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        {data.assets_breakdown?.length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4">Asset Allocation</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.assets_breakdown}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.assets_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cashflow Chart */}
        {data.monthly_trend?.length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {data.recent_transactions?.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="divide-y">
            {data.recent_transactions.map((txn, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{txn.description}</p>
                  <p className="text-xs text-gray-500">
                    {txn.category || txn.source} &middot; {formatDate(txn.date)}
                  </p>
                </div>
                <span className={`font-semibold text-sm ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
