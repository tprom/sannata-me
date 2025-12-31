import Page from '@/components/book/Page';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import typography from '../typography.module.css';
import styles from './IntroLeftPage.module.css';

export default function IntroLeftPage() {
  const t = useTranslations('intro');

  return (
    <Page>
      <div className={styles.container}>
        <h2 className={typography.title}>{t('slogan')}</h2>

        <div className={styles.illustration}>
          <Image
            src="/images/castle.png"
            alt="Sannata Castle"
            width={260}
            height={160}
          />
        </div>

        <div className={typography.brand}>
          SANNATA.me
        </div>

        <div className={styles.divider}>
          <Image
            src="/images/divider.png"
            alt="Decorative Divider"
            width={220}
            height={32}
          />
        </div>

        <p className={typography.subtitle}>{t('subtitle')}</p>

        <div className={styles.footer}>
          <span className={typography.note}>{t('footer')}</span>
        </div>
      </div>
    </Page>
  );
}
