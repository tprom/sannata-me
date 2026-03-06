'use client';

import { useEffect, useState } from 'react';
import PortalBook from '@/components/book/PortalBook';

export default function BookReader({ slug, lang }) {
  const [pages, setPages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBook() {
      try {
        const res = await fetch(`/api/books/${slug}?type=announcement`);

        if (!res.ok) {
          throw new Error(`Cannot load book: ${slug}`);
        }

        const data = await res.json();

        // Передаём ЧИСТЫЕ ДАННЫЕ, без JSX и без размеров
        const preparedPages = data.map((page, index) => ({
  ...page,
  key: index,
  slug
}));


        setPages(preparedPages);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    }

    loadBook();
  }, [slug, lang]);

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Error loading book</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!pages) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading…</h2>
      </div>
    );
  }

  return <PortalBook pages={pages} lang={lang} hideControls={false} />;

}
