import PostcardLayout from "./PostcardLayout/PostcardLayout";

export default function ItemSectionsRenderer({
  envelope,
  fallbackView,
  fallbackGallery,
  gallerySource,
}) {
  const postcardSection = envelope?.sections?.find(
    (section) => section?.payload?.kind === "postcard",
  );
  const summarySection = envelope?.sections?.find(
    (section) => section?.payload?.kind === "summary",
  );
  const factsSection = envelope?.sections?.find(
    (section) => section?.payload?.kind === "facts",
  );
  const gallerySection = envelope?.sections?.find(
    (section) => section?.payload?.kind === "gallery",
  );

  const view =
    postcardSection?.payload?.kind === "postcard"
      ? {
          greeting: postcardSection.payload.greeting,
          stampImage: postcardSection.payload.stampImage,
          contentFile: postcardSection.payload.contentFile,
          footer: postcardSection.payload.footer,
          bookInvite: postcardSection.payload.bookInvite,
          bookLink: postcardSection.payload.bookLink,
        }
      : fallbackView;

  const gallery =
    gallerySection?.payload?.kind === "gallery"
      ? gallerySection.payload.items
      : fallbackGallery;

  return (
    <>
      <PostcardLayout
        view={view}
        gallery={gallery}
        gallerySource={gallerySource}
        style={null}
      />

      {summarySection?.payload?.kind === "summary" && (
        <section className="city-zone-2">
          <div className="city-zone-2-header">
            {summarySection.payload.title && (
              <h2>{summarySection.payload.title}</h2>
            )}
            {summarySection.payload.subtitle && (
              <p className="city-zone-2-subtitle">
                {summarySection.payload.subtitle}
              </p>
            )}
          </div>
          <p className="city-zone-2-description">
            {summarySection.payload.description}
          </p>
        </section>
      )}

      {factsSection?.payload?.kind === "facts" &&
        factsSection.payload.items?.length > 0 && (
          <section className="city-zone-2">
            <ul className="city-zone-2-highlights">
              {factsSection.payload.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
    </>
  );
}
