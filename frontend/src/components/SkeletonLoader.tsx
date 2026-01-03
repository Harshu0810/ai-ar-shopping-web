export default function SkeletonLoader() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="bg-gray-300 dark:bg-gray-700 h-64 w-full"></div>
      <div className="p-4">
        <div className="bg-gray-300 dark:bg-gray-700 h-4 w-3/4 mb-2 rounded"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-4 w-1/2 mb-4 rounded"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-10 w-full rounded"></div>
      </div>
    </div>
  )
}
