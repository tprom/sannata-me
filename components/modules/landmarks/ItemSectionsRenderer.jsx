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
  const gallerySection = envelope?.sections?.find(
    (section) => section?.payload?.kind === "gallery",
  );

  const view =
    postcardSection?.payload?.kind === "postcard"
      ? {
          greeting: postcardSection.payload.greeting,
          stampImage: postcardSection.payload.stampImage,
          contentFile: postcardSection.payload.contentFile,
          farewell:
            postcardSection.payload.farewell ?? postcardSection.payload.footer,
          invitation: postcardSection.payload.invitation,
          invitationBookLink: postcardSection.payload.invitationBookLink,
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
    </>
  );
}
