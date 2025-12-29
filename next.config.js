import nextIntl from 'next-intl/plugin';

const withNextIntl = nextIntl('./next-intl.config.mjs');

export default withNextIntl({
  reactStrictMode: true
});
