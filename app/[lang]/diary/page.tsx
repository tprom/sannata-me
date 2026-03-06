import DiaryModule from '@/components/modules/diary/DiaryModule';

export default function DiaryPage({ params }) {
  return <DiaryModule lang={params.lang} />;
}
