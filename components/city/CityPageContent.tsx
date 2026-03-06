import type { CityPageContent as CityPageContentType } from "@/data/types";
import IllustrationBlockRenderer from "@/components/city/IllustrationBlockRenderer";

type Props = {
  content: CityPageContentType;
  lang: string;
};

export default function CityPageContent({ content, lang }: Props) {
  const l = lang as keyof typeof content.greeting;

  const greeting = content.greeting?.[l];
  const description = content.description?.[l];
  const invitation = content.invitation?.[l];
  const illustrations = content.illustrations ?? [];

  return (
    <div className="city-page-content">
      {greeting && (
        <p className="city-page-greeting">{greeting}</p>
      )}

      {description && (
        <div className="city-page-description">
          <p>{description}</p>
        </div>
      )}

      {illustrations.length > 0 && (
        <div className="city-page-illustrations">
          {illustrations.map((block, index) => (
            <IllustrationBlockRenderer key={index} block={block} lang={lang} />
          ))}
        </div>
      )}

      {invitation && (
        <div className="city-page-invitation">
          <p>{invitation}</p>
        </div>
      )}
    </div>
  );
}
