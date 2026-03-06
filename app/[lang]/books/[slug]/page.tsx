import BooksModule from '@/components/modules/books/BooksModule';

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export default async function BookSlugPage({ params }: Props) {
  const { lang, slug } = await params;
  return <BooksModule lang={lang} slug={slug} />;
}
