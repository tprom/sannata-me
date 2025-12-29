import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'de', 'ru', 'ua'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};
