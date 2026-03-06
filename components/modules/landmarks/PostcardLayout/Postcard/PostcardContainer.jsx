import styles from "./PostcardContainer.module.css";
import PostcardStamp from "./PostcardStamp";
import PostcardText from "./PostcardText";

export default function PostcardContainer({
  greeting = "",
  stampImage = null,
  contentFile = "",
  footer = "",
  bookInvite = "",
  bookLink = "",
}) {
  const hasBookCta = Boolean(bookInvite?.trim() && bookLink?.trim());
  const isExternalLink = /^https?:\/\//i.test(bookLink.trim());

  return (
    <article className={styles.container}>
      <div className={styles.scrollArea}>
        <div className={styles.topRow}>
          <div className={styles.greetingZone}>{greeting}</div>
          <div className={styles.stampZone}>
            <PostcardStamp stampImage={stampImage} />
          </div>
        </div>
        <div className={styles.contentZone}>
          <PostcardText text={contentFile} />
        </div>
        <div className={styles.footerZone}>{footer}</div>
        {hasBookCta ? (
          <div className={styles.bookCtaZone}>
            <span className={styles.bookInviteText}>{bookInvite}</span>
            <span className={styles.bookArrow} aria-hidden="true">
              ⟶
            </span>
            <a
              className={styles.bookButton}
              href={bookLink}
              {...(isExternalLink
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className={styles.bookButtonIcon} aria-hidden="true">
                📖
              </span>
              <span>Открыть книгу</span>
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
