'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const LANGS = ['en', 'de', 'ru', 'uk'] as const;

export default function GlobalNavigation() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tb = useTranslations('books');

  const segments = pathname.split('/').filter(Boolean);
  const currentLang = (segments[0] as (typeof LANGS)[number]) || 'en';

  const basePath = `/${currentLang}`;

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        zIndex: 1000
      }}
    >
      {/* Левая часть: модули */}
      <nav style={{ display: 'flex', gap: 16 }}>
        <NavLink href={`${basePath}/books`} label={t('books')} activePath={pathname} />
        <NavLink href={`${basePath}/insights`} label={t('insights')} activePath={pathname} />
        <NavLink href={`${basePath}/landmarks`} label={t('landmarks')} activePath={pathname} />
        <NavLink href={`${basePath}/studio`} label={t('studio')} activePath={pathname} />
        <NavLink href={`${basePath}/diary`} label={t('diary')}  activePath={pathname} />
      </nav>

      {/* Центр: бренд SANNATA.me */}
      <Link
        href={basePath}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 2,
          color: '#111'
        }}
      >
        {t('brand')}
      </Link>

      {/* Правая часть: языки */}
      <div style={{ display: 'flex', gap: 8 }}>
        {LANGS.map(lang => {
          const isActive = lang === currentLang;

          return (
            <Link
              key={lang}
              href={pathname.replace(`/${currentLang}`, `/${lang}`) || `/${lang}`}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 13,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: 1,
                border: isActive ? '1px solid #111' : '1px solid transparent',
                background: isActive ? '#111' : 'transparent',
                color: isActive ? '#fff' : '#555'
              }}
            >
              {lang}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  activePath
}: {
  href: string;
  label: string;
  activePath: string;
}) {
  const isActive = activePath.startsWith(href);

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        fontSize: 14,
        color: isActive ? '#111' : '#666',
        fontWeight: isActive ? 600 : 400,
        padding: '6px 10px',
        borderRadius: 999,
        background: isActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
      }}
    >
      {label}
    </Link>
  );
}
