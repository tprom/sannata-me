"use client";

import styles from "./LandmarksPage.module.css";
import PostcardLayout from "./PostcardLayout/PostcardLayout";
import ItemSectionsRenderer from "./ItemSectionsRenderer";
export default function LandmarksPage({
  sidebar = null,
  allowOverflow = false,
  view = null,
  gallery = [],
  gallerySource = "legacy",
  envelope = null,
}) {
  const isUniversalItem = envelope?.pageKind === "item";

  const layoutClassName = [
    styles.layout,
    allowOverflow ? styles.allowOverflow : null,
  ]
    .filter(Boolean)
    .join(" ");

  const contentClassName = [
    styles.contentColumn,
    isUniversalItem ? styles.universalContent : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClassName}>
      <aside className={styles.menuColumn}>
        <div className={styles.menuScroll}>{sidebar}</div>
      </aside>
      <main className={contentClassName}>
        {isUniversalItem ? (
          <div className={styles.universalStack}>
            <ItemSectionsRenderer
              envelope={envelope}
              fallbackView={view}
              fallbackGallery={gallery}
              gallerySource={gallerySource}
            />
          </div>
        ) : (
          <PostcardLayout
            view={view}
            gallery={gallery}
            gallerySource={gallerySource}
            style={null}
          />
        )}
      </main>
    </div>
  );
}
