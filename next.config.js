import nextIntl from 'next-intl/plugin';

const withNextIntl = nextIntl('./i18n/request.ts');

export default withNextIntl({
  reactStrictMode: true
});

