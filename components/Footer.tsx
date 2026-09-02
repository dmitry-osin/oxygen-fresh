// Public site footer. Minimal, typography-first (UI 5.2).

export function Footer({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer class="border-t border-gray-200 mt-16">
      <div class="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-500 flex justify-between">
        <span>&copy; {year} {siteName}</span>
        <a href="/rss.xml" class="hover:text-gray-900">RSS</a>
      </div>
    </footer>
  );
}
