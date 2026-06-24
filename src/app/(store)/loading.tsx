export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
