import Page from '@/components/book/Page.tsx';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function IntroSpread() {
  const t = useTranslations('intro');

  return [
    <Page key="intro-left">
      <div style={{ /* твои стили */ }}>
        <h2>{t('slogan')}</h2>

        <Image src="/images/castle.png" alt="Sannata Castle" width={300} height={200} />

        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          SANNATA.me
        </div>

        <Image src="/images/divider.png" alt="Decorative Divider" width={240} height={40} />

        <p>{t('subtitle')}</p>

        <div style={{ position: 'absolute', bottom: '20px', right: '30px' }}>
          {t('footer')}
        </div>
      </div>
    </Page>,

    <Page key="intro-right">
      <div style={{ /* твои стили */ }}>
        <p>{t('rightPageText')}</p>
      </div>
    </Page>,
  ];
}


