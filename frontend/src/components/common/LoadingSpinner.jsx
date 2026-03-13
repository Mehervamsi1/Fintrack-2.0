export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="clay-card-flat p-5 rounded-full">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}
