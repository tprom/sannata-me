// pages/_app.js
import '@/styles/globals.css';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function App({ Component, pageProps }) {
  return (
    <>
      <LanguageSwitcher />
      <Component {...pageProps} />
    </>
  );
}
