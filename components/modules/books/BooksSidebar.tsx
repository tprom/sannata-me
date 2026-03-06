'use client';

import Link from 'next/link';
import booksData from '@/data/books/books.json';
import { SHELF_LAYOUT } from './shelfLayout';

type Props = {
  lang: string;
  activeSlug?: string;
};

type RawBook = {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  cover: string;
  future?: boolean;
  decorative?: boolean;
};

type RealBook = {
  type: 'real';
  slug: string;
  title: Record<string, string>;
  cover?: string;
};

type FutureBook = {
  type: 'future';
  slug: string;
  title: Record<string, string>;
  cover?: string;
};

type DecorativeBook = {
  type: 'decorative';
  index: number;
};

type StackItem = RealBook | FutureBook | DecorativeBook;

// ------------------------------
// SHELF LAYOUT
// ------------------------------
const { shelfHeight: SHELF_HEIGHT, plankHeight: PLANK_HEIGHT, sidebarPaddingTop: SIDEBAR_PADDING_TOP } = SHELF_LAYOUT;

const isDecorative = (item: StackItem): item is DecorativeBook =>
  item.type === 'decorative';

const isFuture = (item: StackItem): item is FutureBook =>
  item.type === 'future';

const isReal = (item: StackItem): item is RealBook =>
  item.type === 'real';

const colorPalette = [
  '#E8DCC2',
  '#D7C7A3',
  '#C9B89A',
  '#F0E6D8',
  '#E4D8C8',
  '#D0C4B4',
  '#F3EDE3'
];

const decorativeWords = ['BOOK', 'KIDS', 'TALES', 'FUN', 'MAGIC', 'ABC'];
const decorativeSymbols = ['●', '★', '◆', '▲', '✿', '✦'];

const getDecorativeColor = (index: number) =>
  colorPalette[index % colorPalette.length];

const getRandomRotation = (index: number) => {
  const seed = index * 37;
  return (seed % 7) - 3;
};

const getRandomThickness = (index: number) => {
  const seed = index * 41;
  return 32 + (seed % 13);
};

export default function BooksSidebar({ lang, activeSlug }: Props) {
  const rawBooks = booksData as RawBook[];

  // REAL BOOKS
  const realBooks: RealBook[] = rawBooks
    .filter((b) => !b.future && !b.decorative)
    .map((b) => ({
      type: 'real',
      slug: b.slug,
      title: b.title,
      cover: b.cover
    }));

  // FUTURE BOOKS
  const futureBooks: FutureBook[] = rawBooks
    .filter((b) => b.future === true)
    .map((b) => ({
      type: 'future',
      slug: b.slug,
      title: b.title,
      cover: b.cover
    }));

  const activeBook =
    realBooks.find((b) => b.slug === activeSlug) || realBooks[0];

  // DECORATIVE BOOKS
  const generateDecorativeBooks = (
    count: number,
    startIndex: number
  ): DecorativeBook[] =>
    Array.from({ length: count }, (_, i) => ({
      type: 'decorative',
      index: startIndex + i
    }));

  // ------------------------------
  // FINAL STACKS
  // ------------------------------

  // Верхняя полка — 5 книг
  const upperStack: StackItem[] = [
    ...generateDecorativeBooks(2, 0),
    ...futureBooks.slice(0, 2),
    activeBook
  ].slice(0, 5);

  // Нижняя полка — всегда 5 декоративных книг
  const lowerStack: StackItem[] = generateDecorativeBooks(5, 200);

  // ------------------------------
  // STYLES
  // ------------------------------

  const plankStyle = {
    width: '100%',
    height: `${PLANK_HEIGHT}px`,
    background: '#D8D8D5',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const linenTextureBase = `
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 0px,
      rgba(255,255,255,0.04) 2px,
      rgba(0,0,0,0.04) 3px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(0,0,0,0.03) 0px,
      rgba(0,0,0,0.03) 1px,
      transparent 2px
    ),
    linear-gradient(
      90deg,
      rgba(255,255,255,0.15) 0%,
      rgba(255,255,255,0.35) 50%,
      rgba(0,0,0,0.15) 100%
    ),
    linear-gradient(
      90deg,
      rgba(0,0,0,0.25) 0%,
      transparent 10%,
      transparent 90%,
      rgba(0,0,0,0.25) 100%
    ),
    linear-gradient(
      90deg,
      rgba(0,0,0,0.3) 1px,
      transparent 2px
    )
  `;

  const decorativeTexture = linenTextureBase;

  const futureTexture = linenTextureBase
    .replace(/0\.04/g, '0.025')
    .replace(/0\.03/g, '0.02')
    .replace(/0\.35/g, '0.25');

  const realTexture = linenTextureBase
    .replace(/0\.04/g, '0.03')
    .replace(/0\.03/g, '0.02')
    .replace(/0\.35/g, '0.30');

  const bookSpineStyle = (
    bgColor: string,
    rotation: number,
    thickness: number,
    isActive: boolean,
    isFuture: boolean,
    isDecor: boolean
  ) => ({
    width: '100%',
    minHeight: `${thickness}px`,
    backgroundColor: bgColor,
    backgroundImage: isDecor
      ? decorativeTexture
      : isFuture
      ? futureTexture
      : realTexture,
    backgroundBlendMode: 'overlay',
    backgroundSize: `
      100% 100%,
      100% 100%,
      100% 100%,
      100% 100%,
      100% 100%
    `,
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    overflow: 'hidden',
    transform: `rotateZ(${rotation}deg)`,
    boxShadow: `
      inset 2px 0 3px rgba(0,0,0,0.08),
      0 2px 4px rgba(0,0,0,0.15)
    `,
    marginBottom: '8px',
    cursor: isFuture || isDecor ? 'default' : 'pointer',
    transition: 'all 0.2s ease-out',
    opacity: isFuture ? 0.9 : 1,
    color: '#2a2a2a',
    fontWeight: 600,
    textShadow: !isDecor && !isFuture
      ? `
        1px 1px 0 rgba(255,255,255,0.4),
        -1px -1px 0 rgba(0,0,0,0.2)
      `
      : 'none'
  });

const renderBook = (book: StackItem, index: number) => {
  const isDecor = isDecorative(book);
  const isFut = isFuture(book);
  const isRealBook = isReal(book);
  const isActive = isRealBook && book.slug === activeBook.slug;

  const bgColor = getDecorativeColor(index);
  const rotation = isActive ? 0 : getRandomRotation(index);
  const thickness = isDecor ? getRandomThickness(index) : 40;

  const style = bookSpineStyle(
    bgColor,
    rotation,
    thickness,
    isActive,
    isFut,
    isDecor
  );

  // ------------------------------
  // DECORATIVE BOOK (оставляем украшения)
  // ------------------------------
  if (isDecor) {
    const word = decorativeWords[index % decorativeWords.length];
    const symbol = decorativeSymbols[index % decorativeSymbols.length];

    return (
      <div key={`decor-${index}`} style={style}>
        <span
          style={{
            fontSize: 12,
            opacity: 0.7,
            letterSpacing: '2px',
            marginRight: 8,
            textTransform: 'uppercase'
          }}
        >
          {word}
        </span>

        <span
          style={{
            fontSize: 14,
            opacity: 0.6,
            marginLeft: 'auto'
          }}
        >
          {symbol}
        </span>
      </div>
    );
  }

  // ------------------------------
  // FUTURE BOOK (убираем украшения)
  // ------------------------------
  if (isFut) {
    return (
      <div key={`future-${book.slug}`} style={style}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#555',
            flex: 1
          }}
        >
          {book.title[lang]}
        </span>
      </div>
    );
  }

  // ------------------------------
  // REAL BOOK (убираем STORY и ✦)
  // ------------------------------
  return (
    <Link
      key={`real-${book.slug}`}
      href={`/${lang}/books/${book.slug}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={style}>
        {isActive && book.cover && (
          <img
            src={book.cover}
            alt=""
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              objectFit: 'cover',
              marginRight: 12
            }}
          />
        )}

        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#333',
            flex: 1
          }}
        >
          {book.title[lang]}
        </span>
      </div>
    </Link>
  );
};



  return (
    <aside
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        paddingTop: SIDEBAR_PADDING_TOP,
        background: `
          linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px),
          linear-gradient(0deg, #F4F4F2, #E2E2DF)
        `,
        backgroundSize: '4px 100%, 100% 100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={plankStyle} />

      <div
        style={{
          height: SHELF_HEIGHT,
          padding: '0 24px',
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column-reverse',
          overflow: 'hidden'
        }}
      >
        {upperStack.map((book, idx) => renderBook(book, idx))}
      </div>

      <div style={plankStyle} />

      <div
        style={{
          height: SHELF_HEIGHT,
          padding: '0 24px',
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column-reverse',
          overflow: 'hidden'
        }}
      >
        {lowerStack.map((book, idx) => renderBook(book, idx + 100))}
      </div>

      <div style={plankStyle} />
    </aside>
  );
}
