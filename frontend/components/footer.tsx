export function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-100 bg-white">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-sm text-brand-500">
          &copy; {new Date().getFullYear()} Wander Lust Store. Gear for the
          journey.
        </p>
        <p className="text-xs text-brand-400">
          Built with Next.js &amp; NestJS — a portfolio project.
        </p>
      </div>
    </footer>
  );
}
