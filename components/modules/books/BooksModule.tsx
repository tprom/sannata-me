// /components/modules/books/BooksModule.tsx

'use client';

import books from '@/data/books.json';
import PageRenderer from '@/components/book/PageRenderer';

const BooksModule = {
  generate() {
    const book = books.ketti;

    // ✔ Генерируем массив React‑элементов
    const pages = book.pages.map((pageData: any, index: number) => (
      <PageRenderer key={index} data={pageData} />
    ));

    const navigation = {
      title: 'Books',
      active: 'ketti',
      items: [
        { id: 'ketti', label: 'Ketti' }
      ]
    };

    const controls = {
      onSelect: (id: string) => {
        console.log('Selected book:', id);
      }
    };

    return { navigation, pages, controls };
  }
};

export default BooksModule;

