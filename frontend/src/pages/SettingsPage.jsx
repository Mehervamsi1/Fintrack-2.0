import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api/auth';
import client from '../api/client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  const { data: prefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => client.get('/preferences/').then((r) => r.data),
  });

  const [currency, setCurrency] = useState(prefs?.currency || 'USD');

  const profileMutation = useMutation({
    mutationFn: (data) => updateUser(data),
    onSuccess: (res) => { setUser(res.data); toast.success('Profile updated'); },
  });

  const prefMutation = useMutation({
    mutationFn: (data) => client.put('/preferences/', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['preferences'] }); toast.success('Preferences saved'); },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Profile</h3>
        <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profile); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            Save Profile
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Preferences</h3>
        <form onSubmit={(e) => { e.preventDefault(); prefMutation.mutate({ currency }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'BRL'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
