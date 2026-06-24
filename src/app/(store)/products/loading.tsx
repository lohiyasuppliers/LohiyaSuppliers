export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="lg:col-span-2 h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
