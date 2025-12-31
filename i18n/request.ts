import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  const locale = typeof requestLocale === 'string' ? requestLocale : 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

