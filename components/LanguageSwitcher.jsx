// components/LanguageSwitcher.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function LanguageSwitcher() {
  const { locale, pathname } = useRouter();
  const locales = ['de', 'en', 'ru', 'uk'];

  return (
    <nav className="lang-switcher" aria-label="Language switcher">
      {locales.map((l) => (
        <Link key={l} href={pathname} locale={l} className={l === locale ? 'active' : ''}>
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
