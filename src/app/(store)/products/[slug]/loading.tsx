export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
          <div className="h-6 w-1/4 bg-gray-100 rounded animate-pulse mt-6" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse mt-8" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
