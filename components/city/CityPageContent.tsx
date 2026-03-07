import type { CityPageContent as CityPageContentType } from "@/data/types";
import IllustrationBlockRenderer from "@/components/city/IllustrationBlockRenderer";

type Props = {
  content: CityPageContentType;
  lang: string;
};

export default function CityPageContent({ content, lang }: Props) {
  const l = lang as keyof typeof content.greeting;

  const panorama = content.panorama;
  const greeting = content.greeting?.[l];
  const description = content.description?.[l];
  const invitation = content.invitation?.[l];
  const illustrations = content.illustrations ?? [];

  const paragraphs = (description || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const fallbackParagraphs =
    paragraphs.length > 0 ? paragraphs : description ? [description] : [];

  const illustrationsBefore = (paragraphIndex: number) =>
    illustrations.filter(
      (item) =>
        item.insert?.where === "before" &&
        item.insert?.paragraph === paragraphIndex,
    );

  const illustrationsAfter = (paragraphIndex: number) =>
    illustrations.filter(
      (item) =>
        item.insert?.where === "after" &&
        item.insert?.paragraph === paragraphIndex,
    );

  const illustrationsWithoutInsert = illustrations.filter(
    (item) => !item.insert,
  );

  return (
    <div className="city-page-content">
      {panorama && (
        <div className="city-page-panorama">
          <img
            src={panorama}
            alt="City panorama"
            className="city-page-panorama-img"
          />
        </div>
      )}

      {greeting && <p className="city-page-greeting">{greeting}</p>}

      {fallbackParagraphs.length > 0 && (
        <div className="city-page-description">
          {fallbackParagraphs.map((paragraph, index) => {
            const paragraphIndex = index + 1;
            return (
              <div key={`p-${paragraphIndex}`}>
                {illustrationsBefore(paragraphIndex).map(
                  (block, blockIndex) => (
                    <IllustrationBlockRenderer
                      key={`b-${paragraphIndex}-${blockIndex}`}
                      block={block}
                      lang={lang}
                    />
                  ),
                )}
                <p>{paragraph}</p>
                {illustrationsAfter(paragraphIndex).map((block, blockIndex) => (
                  <IllustrationBlockRenderer
                    key={`a-${paragraphIndex}-${blockIndex}`}
                    block={block}
                    lang={lang}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {illustrationsWithoutInsert.length > 0 && (
        <div className="city-page-illustrations">
          {illustrationsWithoutInsert.map((block, index) => (
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
