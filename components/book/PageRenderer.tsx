// /components/book/PageRenderer.tsx

import Page from './Page';
import Title from './elements/Title';
import Paragraph from './elements/Paragraph';
import ImageBlock from './elements/ImageBlock';

type Element =
  | { type: 'title'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string };

type PageData = {
  type: 'page';
  elements: Element[];
};

export default function PageRenderer({ data }: { data: PageData }) {
  return (
    <Page>
      {data.elements.map((el, index) => {
        switch (el.type) {
          case 'title':
            return <Title key={index} text={el.text} />;
          case 'paragraph':
            return <Paragraph key={index} text={el.text} />;
          case 'image':
            return <ImageBlock key={index} src={el.src} />;
          default:
            return null;
        }
      })}
    </Page>
  );
}
