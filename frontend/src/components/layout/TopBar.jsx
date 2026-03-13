import { useAuth } from '../../context/AuthContext';

export default function TopBar({ onMenuClick }) {
  const { user, logoutUser } = useAuth();

  return (
    <header className="h-16 clay-topbar flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-white/40 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="clay-card-flat px-4 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user?.first_name || user?.username}
          </span>
        </div>
        <button
          onClick={logoutUser}
          className="clay-btn-ghost clay-btn text-xs px-3 py-2"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
