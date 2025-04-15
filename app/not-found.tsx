import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-offwhite">
      <h1 className="text-4xl font-serif mb-4 text-gray-900">404 - Page Not Found</h1>
      <p className="text-lg mb-8 text-center text-gray-600">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 