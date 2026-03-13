import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).flat().forEach((msg) => toast.error(String(msg)));
      else toast.error('Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #e8edf5 0%, #d5dbe8 50%, #e0e5f0 100%)' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">FinTrack</h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wide">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="clay-card p-8 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-600 mb-2">First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} className="clay-input" placeholder="John" /></div>
            <div><label className="block text-sm font-semibold text-gray-600 mb-2">Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} className="clay-input" placeholder="Doe" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-gray-600 mb-2">Username</label>
            <input name="username" value={form.username} onChange={handleChange} required className="clay-input" placeholder="johndoe" /></div>
          <div><label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="clay-input" placeholder="john@example.com" /></div>
          <div><label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className="clay-input" placeholder="Min 6 characters" /></div>
          <button type="submit" disabled={loading} className="clay-btn w-full py-3 text-base">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
