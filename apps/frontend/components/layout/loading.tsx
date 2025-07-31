export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-blue-600 dark:text-white font-semibold text-lg">Loading...</span>
      </div>
    </div>
  );
}