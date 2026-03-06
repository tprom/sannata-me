import { NextIntlClientProvider } from 'next-intl';
import GlobalNavigation from '@/components/portal/GlobalNavigation';

export default async function LangLayout({ children, params }) {
  const { lang } = await params;

  const booksMainPage = await import(`../../messages/${lang}/books/mainPage.json`);
  const nav = await import(`../../messages/${lang}/nav.json`);

  const messages = {
    nav: nav.default,
    books: {
      mainPage: booksMainPage.default
    }
  };

  return (
    <NextIntlClientProvider messages={messages} locale={lang}>
      <GlobalNavigation />
      <main>{children}</main>
    </NextIntlClientProvider>
  );
}
