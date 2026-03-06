type LandmarkContentItem =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; caption?: string };

type Props = {
  title: string;
  description?: string;
  history?: string;
  facts?: string[];
  content: LandmarkContentItem[];
};

export default function LandmarkContent({
  title,
  description,
  history,
  facts = [],
  content = [],
}: Props) {
  return (
    <article className="landmark-content">
      <header>
        <h1>{title}</h1>
        {description && <p className="landmarks-muted">{description}</p>}
      </header>

      {history && (
        <section>
          <h3>История</h3>
          <p>{history}</p>
        </section>
      )}

      {facts.length > 0 && (
        <section>
          <h3>Факты</h3>
          <ul>
            {facts.map((fact, index) => (
              <li key={`${fact}-${index}`}>{fact}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="landmark-content-body">
        {content.map((block, index) => {
          if (block.type === "image") {
            return (
              <figure key={`${block.src}-${index}`} className="landmark-content-image">
                <img src={block.src} alt={block.caption ?? title} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          }

          return <p key={`${block.text}-${index}`}>{block.text}</p>;
        })}
      </section>
    </article>
  );
}
