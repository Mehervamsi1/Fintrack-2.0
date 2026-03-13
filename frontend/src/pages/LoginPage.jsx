import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, getUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: tokens } = await login(username, password);
      localStorage.setItem('access_token', tokens.access);
      const { data: userData } = await getUser();
      loginUser(tokens, userData);
      navigate('/');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #e8edf5 0%, #d5dbe8 50%, #e0e5f0 100%)' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
            FinTrack
          </h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wide">Manage your finances with clarity</p>
        </div>
        <form onSubmit={handleSubmit} className="clay-card p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="clay-input"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="clay-input"
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="clay-btn w-full py-3 text-base">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
