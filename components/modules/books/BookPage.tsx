'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import booksData from '@/data/books/books.json';

type Props = {
  lang: string;
  slug: string;
};

export default function BookPage({ lang, slug }: Props) {
  const t = useTranslations('books');

  const book = booksData.find(b => b.slug === slug);

  if (!book) {
    return (
      <div style={{ padding: 40 }}>
        <h1>{t('notFound')}</h1>
        <p>{t('notFoundText')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h1>{book.title[lang]}</h1>

      <img
        src={book.cover}
        alt={book.title[lang]}
        style={{
          width: 260,
          borderRadius: 12,
          marginBottom: 24
        }}
      />

      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        {book.description[lang]}
      </p>

      <Link
        href={`/${lang}/books/${slug}/read`}
        style={{
          display: 'inline-block',
          marginTop: 24,
          padding: '12px 24px',
          background: '#111',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 16
        }}
      >
        {t('read')}
      </Link>
    </div>
  );
}
