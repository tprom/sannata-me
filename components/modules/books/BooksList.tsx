'use client';

import Link from 'next/link';
import booksData from '@/data/books/books.json';
import { useTranslations } from 'next-intl';

export default function BooksList() {
  const t = useTranslations('books');

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('allBooks')}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {booksData.map(book => (
          <div
            key={book.slug}
            style={{
              display: 'flex',
              gap: 20,
              padding: 20,
              border: '1px solid #ddd',
              borderRadius: 12
            }}
          >
            <img
              src={book.cover}
              alt={book.title.en}
              style={{
                width: 120,
                height: 'auto',
                borderRadius: 8
              }}
            />

            <div>
              <h2>{book.title.en}</h2>
              <p style={{ margin: '8px 0 16px' }}>{book.description.en}</p>

              <Link
                href={`/en/books/${book.slug}`}
                style={{
                  padding: '8px 16px',
                  background: '#111',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none'
                }}
              >
                {t('open')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

