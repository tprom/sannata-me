import styles from "./PostcardContainer.module.css";
import PostcardStamp from "./PostcardStamp";
import PostcardText from "./PostcardText";

export default function PostcardContainer({
  greeting = "",
  stampImage = null,
  contentFile = "",
  farewell = "",
  invitation = "",
  invitationBookLink = "",
}) {
  const isExternalLink = /^https?:\/\//i.test(invitationBookLink.trim());

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

        {farewell ? (
          <div className={styles.farewellZone}>{farewell}</div>
        ) : null}

        {invitation || invitationBookLink ? (
          <div className={styles.invitationZone}>
            {invitation ? <span>{invitation}</span> : null}

            {invitationBookLink ? (
              <a
                className={styles.bookLink}
                href={invitationBookLink}
                {...(isExternalLink
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <span className={styles.bookArrow} aria-hidden="true">
                  →
                </span>
                <span className={styles.bookIcon} aria-hidden="true">
                  📖
                </span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
