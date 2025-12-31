import Page from '@/components/book/Page';
import { useTranslations } from 'next-intl';

export default function IntroRightPage() {
  const t = useTranslations('intro');

  return (
    <Page>
      <p>{t('rightPageText')}</p>
    </Page>
  );
}

