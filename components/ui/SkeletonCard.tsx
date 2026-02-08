'use client';

/**
 * SkeletonCard - Animated loading placeholder matching NewsCard layout
 */
export default function SkeletonCard() {
  return (
    <div className="border border-gray-300 bg-white">
      {/* Header skeleton */}
      <div className="border-b px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-sm" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-sm" />
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-sm" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-6">
        <div className="space-y-3 mb-4">
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded-sm" />
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded-sm" />
          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded-sm" />
        </div>

        {/* Button skeleton */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded-sm" />
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}
