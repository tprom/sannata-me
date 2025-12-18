// pages/index.js
import Sections from '@/components/Sections';
import getMessages from '@/lib/getMessages';

export default function Home({ messages }) {
  return <Sections t={messages} />;
}

export async function getStaticProps({ locale }) {
  const messages = getMessages(locale);
  return {
    props: { messages }
  };
}
