import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-900">Page not found</h1>
      <p className="mt-2 text-brand-500">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
