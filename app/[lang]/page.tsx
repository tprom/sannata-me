import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import Header from '@/components/portal/Header';

import Flipbook from '@/components/portal/Flipbook';
import IntroLeftPage from '@/components/portal/intro/IntroLeftPage';
import IntroRightPage from '@/components/portal/intro/IntroRightPage';

export default async function LangPage({ params }: { params: { lang: string } }) {
  const { lang } = await Promise.resolve(params);

  let messages;
  try {
    messages = (await import(`../../messages/${lang}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={lang} messages={messages}>
      <Header lang={lang} />

      <Flipbook
        pages={[
          <IntroLeftPage key="intro-left" />,
          <IntroRightPage key="intro-right" />
        ]}
      />
    </NextIntlClientProvider>
  );
}

