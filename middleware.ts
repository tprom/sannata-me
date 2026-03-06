import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'de', 'ru', 'uk'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/((?!_next|api|.*\\..*|favicon|sitemap|robots).*)']
};
