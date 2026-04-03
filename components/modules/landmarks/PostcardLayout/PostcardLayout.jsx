"use client";

import styles from "./PostcardLayout.module.css";
import PostcardContainer from "./Postcard/PostcardContainer";
import FilmstripGallery from "./Filmstrip/FilmstripGallery";

export default function PostcardLayout({
  view,
  greeting,
  stampImage,
  contentFile,
  farewell,
  invitation,
  invitationBookLink,
  gallery,
  gallerySource,
  style,
}) {
  const className = [styles.layout, style].filter(Boolean).join(" ");
  const resolvedGreeting = greeting ?? view?.greeting ?? "";
  const resolvedStampImage = stampImage ?? view?.stampImage ?? null;
  const resolvedContentFile = contentFile ?? view?.contentFile ?? "";
  const resolvedFarewell = farewell ?? view?.farewell ?? view?.footer ?? "";
  const resolvedInvitation = invitation ?? view?.invitation ?? "";
  const resolvedInvitationBookLink =
    invitationBookLink ?? view?.invitationBookLink ?? "";
  const showGallerySource =
    process.env.NODE_ENV !== "production" &&
    (gallerySource === "generated" || gallerySource === "legacy");

  return (
    <div className={className}>
      <section className={styles.postcardColumn}>
        <PostcardContainer
          greeting={resolvedGreeting}
          stampImage={resolvedStampImage}
          contentFile={resolvedContentFile}
          farewell={resolvedFarewell}
          invitation={resolvedInvitation}
          invitationBookLink={resolvedInvitationBookLink}
        />
      </section>
      <aside className={styles.filmstripColumn}>
        {showGallerySource ? (
          <div className={styles.gallerySourceBadge}>
            gallery: {gallerySource}
          </div>
        ) : null}
        <FilmstripGallery images={gallery} />
      </aside>
    </div>
  );
}
