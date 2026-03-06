import BookReader from '@/components/modules/books/BookReader';

type Props = {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
};

export default async function BookReadPage({ params }: Props) {
  const { lang, slug } = await params;

  return <BookReader slug={slug} lang={lang} />;
}

