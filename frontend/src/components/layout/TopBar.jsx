import { useAuth } from '../../context/AuthContext';

export default function TopBar({ onMenuClick }) {
  const { user, logoutUser } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.first_name || user?.username}
        </span>
        <button
          onClick={logoutUser}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
