import { Fragment } from "react";
import type { CityPageContent as CityPageContentType } from "@/data/types";
import IllustrationBlockRenderer from "@/components/city/IllustrationBlockRenderer";

type Props = {
  content: CityPageContentType;
  lang: string;
};

export default function CityPageContent({ content, lang }: Props) {
  const l = lang as keyof typeof content.greeting;

  const greeting = content.greeting?.[l];
  const description = content.description?.[l] ?? "";
  const invitation = content.invitation?.[l];
  const illustrations = content.illustrations ?? [];
  const panorama = content.panorama;

  const splitDescriptionToParagraphs = (value: string): string[] => {
    const normalized = value.replace(/\r\n/g, "\n").trim();
    if (!normalized) return [];

    // Contract mode: paragraph blocks are usually separated by an empty line.
    if (/\n\s*\n/.test(normalized)) {
      return normalized
        .split(/\n\s*\n+/g)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    // Legacy/data mode: some cities store paragraphs with single newline separators.
    return normalized
      .split(/\n+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const paragraphs = splitDescriptionToParagraphs(description);

  const normalizedParagraphs = paragraphs.length > 0 ? paragraphs : description ? [description] : [];

  const beforeByParagraph = new Map<number, typeof illustrations>();
  const afterByParagraph = new Map<number, typeof illustrations>();

  for (const block of illustrations) {
    const paragraph = Math.max(1, block.insert?.paragraph ?? 1);
    const where = block.insert?.where === "before" ? "before" : "after";
    const bucket = where === "before" ? beforeByParagraph : afterByParagraph;
    const current = bucket.get(paragraph) ?? [];
    bucket.set(paragraph, [...current, block]);
  }

  const trailingBefore = Array.from(beforeByParagraph.entries())
    .filter(([paragraph]) => paragraph > normalizedParagraphs.length)
    .flatMap(([, blocks]) => blocks);
  const trailingAfter = Array.from(afterByParagraph.entries())
    .filter(([paragraph]) => paragraph > normalizedParagraphs.length)
    .flatMap(([, blocks]) => blocks);

  return (
    <div className="city-page-content">
      {panorama && (
        <section className="city-page-panorama">
          <img src={panorama} alt="Панорама города" className="city-page-panorama-image" />
        </section>
      )}

      {greeting && (
        <section className="city-page-greeting">
          <p>{greeting}</p>
        </section>
      )}

      {(normalizedParagraphs.length > 0 || illustrations.length > 0) && (
        <section className="city-page-description">
          {normalizedParagraphs.map((paragraph, index) => {
            const paragraphIndex = index + 1;
            const before = beforeByParagraph.get(paragraphIndex) ?? [];
            const after = afterByParagraph.get(paragraphIndex) ?? [];

            return (
              <Fragment key={`paragraph-${paragraphIndex}`}>
                {before.map((block, blockIndex) => (
                  <IllustrationBlockRenderer
                    key={`before-${paragraphIndex}-${blockIndex}`}
                    block={block}
                    lang={lang}
                  />
                ))}
                <p className="city-page-paragraph">{paragraph}</p>
                {after.map((block, blockIndex) => (
                  <IllustrationBlockRenderer
                    key={`after-${paragraphIndex}-${blockIndex}`}
                    block={block}
                    lang={lang}
                  />
                ))}
              </Fragment>
            );
          })}

          {normalizedParagraphs.length === 0 && illustrations.length > 0 && (
            <div className="city-page-illustrations city-page-illustrations-only">
              {illustrations.map((block, index) => (
                <IllustrationBlockRenderer key={`only-${index}`} block={block} lang={lang} />
              ))}
            </div>
          )}

          {trailingBefore.length > 0 && (
            <div className="city-page-illustrations city-page-illustrations-trailing">
              {trailingBefore.map((block, index) => (
                <IllustrationBlockRenderer key={`trailing-before-${index}`} block={block} lang={lang} />
              ))}
            </div>
          )}

          {trailingAfter.length > 0 && (
            <div className="city-page-illustrations city-page-illustrations-trailing">
              {trailingAfter.map((block, index) => (
                <IllustrationBlockRenderer key={`trailing-after-${index}`} block={block} lang={lang} />
              ))}
            </div>
          )}
        </section>
      )}

      {invitation && (
        <section className="city-page-invitation">
          <p>{invitation}</p>
        </section>
      )}
    </div>
  );
}
