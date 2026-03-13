export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative clay-card bg-white/80 backdrop-blur-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ borderRadius: '24px' }}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 pt-2">{children}</div>
      </div>
    </div>
  );
}
