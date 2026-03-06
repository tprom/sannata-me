import BooksSidebar from '@/components/modules/books/BooksSidebar';
import { SHELF_LAYOUT } from '@/components/modules/books/shelfLayout';


type Props = {
  children: React.ReactNode;
  params: Promise<{ lang: string; slug?: string }>;
};

export default async function BooksLayout({ children, params }: Props) {
  const { lang, slug } = await params;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: 360,
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
          paddingTop: SHELF_LAYOUT.menuContainerPaddingTop // ← ключевой момент
        }}
      >
        <BooksSidebar lang={lang} activeSlug={slug} />
      </div>

      <main
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'hidden',
          padding: 0
        }}
      >
        {children}
      </main>
    </div>
  );
}
