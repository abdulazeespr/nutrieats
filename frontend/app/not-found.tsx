import Link from "next/link";

/**
 * Next.js App Router 404 page.
 * Rendered when `notFound()` is called or the route doesn't match.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <span className="text-6xl mb-6 block select-none" aria-hidden="true">
          🔍
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-700">Page not found</p>
        <p className="text-sm text-gray-500 mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Go home
          </Link>
          <Link
            href="/restaurants"
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-semibold transition-colors text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Browse restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
